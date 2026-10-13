---
title: "理解 FlashAttention"
date: 2026-10-09
draft: false
---

Softmax 是 Transformer 里很重要的一环。它本身的计算量不大，但由于数学上的数据依赖，按原始方法计算需要把数据完整读三遍，会耗费大量时间。

Nvidia 的 paper “[Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)” 提出了 online softmax：以多做一点计算的代价换来少读一遍数据，把三遍降到两遍。

[FlashAttention](https://arxiv.org/abs/2205.14135) 用了类似的思想，又往前走了一步：把 softmax 和后面乘 V 的矩阵乘法合进同一个循环，完整的 score 和 probability 矩阵不用再写回内存（DDR 或者 HBM）；再用 tiling （分块）把数据放在 GPU 的片上存储里复用。

下面一步步推导。文中有一些数学公式，但只用到简单的代数；也配了可以按顺序运行的 Python 代码，方便理解。

## Softmax 的数学表达

首先，softmax 作用在一维 vector  $x$ 上，而不是多维 tensor。

```katex
\mathrm{softmax}(\vec{x})_i = \frac{e^{x_i}}{\sum_{j=1}^{N} e^{x_j}}
```

计算分两步：（1）算出每个 $x$ 的 $e^x$ 并加起来；（2）做除法。

### Safe softmax

但 $e^x$ 增长很快，$x$ 稍大一点就容易溢出，用 float16 甚至更低精度时更明显。所以通常先把每个 $x$ 减去最大值，这就是 safe softmax：

```katex
\mathrm{softmax}(\vec{x})_i = \frac{e^{x_i - \max(\vec{x})}}{\sum_{j=1}^{N} e^{x_j - \max(\vec{x})}}
```

分子和分母乘的是同一个因子，结果不变。减完以后指数都不大于 0，只要 $x$ 是有限值，就不会溢出。

这样 softmax 就要读三遍数据：（1）找最大值；（2）求和；（3）做除法。严格来说这是三遍逻辑上的扫描，如果一行数据短到能一直留在片上，就不一定真的从DDR读三次。

如果用 Python 来表示的话：

```python
import math
import random

N = 8
vec_x = [random.random() for _ in range(N)]
# 1st pass
max_x = max(vec_x)
# 2nd pass
sum_ex = sum(math.exp(x - max_x) for x in vec_x)
# 3rd pass
softmax_x = [math.exp(x - max_x) / sum_ex for x in vec_x]
```

## Online softmax

不过，上述三遍读取中的（1）和（2）其实可以合并：一边找最大值，一边求和。

假设我们构造两个数组 $G$ 和 $S$，长度和 $x$ 一样：

```katex
g_i = \max(x_1, \dots, x_i), \qquad
s_i = \sum_{j=1}^{i} e^{x_j - g_i}
```

也就是说，$g_i$ 是到第 $i$ 个元素为止的最大值，$s_i$ 是一个**类似** softmax 分母的和。**$S$ 里的数除了最后一个，都和 softmax 第二步求出的和不一样；但读到最后一个时，$s_N$ 正好等于 softmax 的分母。** 所以只要按顺序读一遍 $x$，同时算出 $G$ 和 $S$，就完成了步骤（1）和（2）。

这里用 $g$（greatest）表示最大值，因为后面 $m$ 要留给 key 的下标；用 $s$ 表示 sum。

> 笔者：这种做法让我想起了 dynamic programming。

$S$ 可以递推计算：

```katex
\begin{aligned}
s_1 &= 1, \\
s_i &= s_{i-1} \times e^{g_{i-1} - g_i} + e^{x_i - g_i}.
\end{aligned}
```

每当最大值变大，旧的和要先乘上 $e^{g_{i-1}-g_i}$，换算到新的最大值下，再加上新的一项。展开一下就能证明，递推出来的 $s_i$ 符合上面的定义，所以 $s_N$ 就是 softmax 的分母：

```katex
\begin{aligned}
s_i &= e^{g_{i-1} - g_i} \sum_{j=1}^{i-1} e^{x_j - g_{i-1}} + e^{x_i - g_i} \\
&= \sum_{j=1}^{i-1} e^{x_j - g_i} + e^{x_i - g_i} \\
&= \sum_{j=1}^{i} e^{x_j - g_i}.
\end{aligned}
```

如果用 Python 来表示的话：

```python
s_prev = 1.0  # s_{i-1}
g_prev = vec_x[0]  # g_{i-1}
for i in range(1, N):  # starting from the 2nd element
    x = vec_x[i]  # read x
    g = max(g_prev, x)  # g_i
    s = s_prev * math.exp(g_prev - g) + math.exp(x - g)  # s_i
    s_prev, g_prev = s, g  # save as s_{i-1} and g_{i-1}

assert g_prev == max_x and math.isclose(s_prev, sum_ex)
```

**Online softmax 把找最大值和求和合成了一遍。但要输出Softmax，还是得等最终的最大值和分母，所以还要再读一遍 $x$ 做除法。这就是从三遍到两遍。**

## Attention 的数学表达

```katex
\mathbb{A} = \mathrm{softmax}\left(\mathrm{mask}\left(\frac{\mathbb{Q} \cdot \mathbb{K}^T}{\sqrt{D}}\right)\right) \cdot \mathbb{V}
```

其中 A、Q、K、V 都是二维矩阵，shape 依次是 `[N, D]`、`[N, D]`、`[M, D]`、`[M, D]`，D 是 head_dim。完整序列的 self-attention 里 `N == M`；decode 一个 token 时 `N = 1`，而 M 包含 KV cache 里的历史。`mask()` 用来实现 causal mask 等各种 masking，它是 element-wise 操作，不影响后面的推导，所以先略过，文章最后再讲需要注意的地方。

**为什么要除以 √D？** 这也是为了控制数值范围。假设 q 和 k 的每个分量都独立，均值为 0、方差为 1，那么点积的方差就是 D（[Attention Is All You Need, §3.2.1](https://arxiv.org/html/1706.03762#S3.SS2.SSS1)）。除以 √D 之后方差回到 1，softmax 的分布不会过于极端，梯度不会太小，训练也更稳定。

**简化 1**：1/√D 是常数。它的 scaling 通常在点积之前就作用在 Q 或 K 上，这样点积本身也不容易溢出。后面就不再写出来了。

**简化 2**：后面也省略 masking（不同架构的 attention 所使用的 masking 不同，但均为常数操作）。

简化以后，再用 X 和 Y 表示中间变量，attention 可以写成：

```katex
\mathrm{softmax}(\mathbb{Q} \cdot \mathbb{K}^T) \cdot \mathbb{V} = \mathrm{softmax}(\mathbb{X}) \cdot \mathbb{V} = \mathbb{Y} \cdot \mathbb{V} = \mathbb{A}
```

用 $\mathbb{X}$ 和 $x$ 表示 softmax 的输入，和前面统一；用 $\mathbb{Y}$ 和 $y$ 表示 softmax 的结果（可惜 $s$ 已经被用了）；用 $\mathbb{A}$ 表示 attention 的结果。

> **注意**：在 LLM 里，batch_size 和 num_head 这两个维度只是在重复独立的 attention 计算。对其中每一个计算来说，N 和 M 取决于序列长度，是运行时才知道的动态变量（runtime dynamic variable）；D 是 head_dim，编译时就确定了（compile-time static variable）。这一点对性能优化非常重要。

## 应用 online softmax 到 attention 上

把 online softmax 用到 attention 上，会有下面两个循环。

### 循环（1）

完全套用 online softmax 的做法。为了不混淆，用 `n`、`m`、`d` 分别表示 N、M、D 三个维度上的下标：

```katex
x_{n,m} = \mathbb{X}[n,m] = \mathbb{Q}[n,:] \cdot \mathbb{K}^T[:,m]
```

矩阵 X 的 shape 是 `[N, M]`，但 softmax 只作用在它的 inner dimension 上，outer dimension 只是重复同样的循环。所以简单起见，只看 X 的一行。`n` 是外循环 `for n in range(N)` 的变量，`m` 是内循环 `for m in range(M)` 的变量：

```katex
\begin{aligned}
x_m &= \mathbb{Q}[n,:] \cdot \mathbb{K}^T[:,m], \\
g_m &= \max(g_{m-1}, x_m), \\
s_m &= s_{m-1} \times e^{g_{m-1} - g_m} + e^{x_m - g_m}.
\end{aligned}
```

### 循环（2）

把类似的思路用在 $\mathbb{Y} \cdot \mathbb{V}$ 上，可以得到：

```katex
\begin{aligned}
y_m &= \frac{e^{x_m - g_M}}{s_M}, \\
\vec{A}_0 &= \vec{0}, \\
\vec{A}_m &= \vec{A}_{m-1} + y_m \times \mathbb{V}[m,:].
\end{aligned}
```

这里 $\mathbb{V}[m,:]$ 是长度为 D 的一行，所以 $\vec{A}_m$ 算的是一个 vector，而不是 scalar。这样做的好处是每个 $y_m$ 用完就可以丢掉，而且这个写法正好引出后面的 FlashAttention。

### 如何理解？

如果你跟我一样觉得这一步有点绕，可以这么理解：**只是把矩阵乘法的内外循环换了一下，再把中间结果存起来。**

这里我们解释一下原理细节。先看一个普通的矩阵乘法：

```katex
\mathbb{A}[n,d] = \mathbb{Y}[n,:] \cdot \mathbb{V}[:,d] = \sum_{m=1}^{M} \mathbb{Y}[n,m] \times \mathbb{V}[m,d]
```

```python
M, D = 6, 4
matrix_y = [[random.random() for _ in range(M)] for _ in range(N)]
matrix_v = [[random.random() for _ in range(D)] for _ in range(M)]

matrix_a = [[0.0] * D for _ in range(N)]
for n in range(N):
    for d in range(D):
        for m in range(M):
            matrix_a[n][d] += matrix_y[n][m] * matrix_v[m][d]
```

如果把循环 D 和循环 M 换个位置，结果完全一样，只是计算顺序变了：原来是一个一个算 A 的 element，现在是先存着 A 一整行的中间值（partial sum），再不断往上累加。

```python
matrix_a2 = [[0.0] * D for _ in range(N)]
for n in range(N):
    for m in range(M):
        for d in range(D):
            matrix_a2[n][d] += matrix_y[n][m] * matrix_v[m][d]

assert matrix_a2 == matrix_a
```

对应的数学表达变成了是：

```katex
\mathbb{A}[n,:] = \sum_{m=1}^{M} \mathbb{Y}[n,m] \times \mathbb{V}[m,:]
```

循环（2）里的 $y_m$ 就是第 n 行的 $\mathbb{Y}[n,m]$。记 $\vec{V}_m = \mathbb{V}[m,:]$，那么：

```katex
\mathbb{A}[n,:] = \vec{A}_M = \sum_{m=1}^{M} y_m \times \vec{V}_m = \sum_{m=1}^{M} \frac{e^{x_m - g_M}}{s_M} \times \vec{V}_m
```

## 优化循环（2）：消除数据依赖、提高并行度

上述的循环（2）还有一个问题：它要等循环（1）跑完，拿到最终的 $g_M$ 和 $s_M$ 才能开始。这就形成了典型的数据依赖，会影响并行度、拖慢运行效率。我们可以用 online softmax 同样的思路，把 $\vec{A}_M$ 的计算也改成递推 {{< katex >}}\vec{A}_m = f(\vec{A}_{m-1}){{< /katex >}}。做法是构造一个新的 {{< katex >}}\vec{A}'_m{{< /katex >}} 来去掉这个数据依赖。我们只需要保证它的最后一个单元与目标一致即可， {{< katex >}}\vec{A}'_M = \vec{A}_M{{< /katex >}}，不需要中间过程也相等。

```katex
\vec{A}'_m = \sum_{i=1}^{m} \frac{e^{x_i - g_m}}{s_m} \times \vec{V}_i
```

当 $m = M$ 时：

```katex
\vec{A}'_M = \sum_{i=1}^{M} \frac{e^{x_i - g_M}}{s_M} \times \vec{V}_i = \vec{A}_M
```

和上面的 $\vec{A}_M$ 对比，看上去只是把 m 换成 i、把 M 换成 m。但 {{< katex >}}\vec{A}'_m{{< /katex >}} 的意思变了：它是只看前 m 个 key 时的 attention 结果。这样就可以用递推来算，不用把中间矩阵写到内存里（avoid materializing the matrix）。

展开后得到：

```katex
\begin{aligned}
\vec{A}'_1 &= \frac{e^{x_1 - g_1}}{s_1} \times \vec{V}_1 = \vec{V}_1, \\
\vec{A}'_m &= \vec{A}'_{m-1} \times \frac{s_{m-1} \times e^{g_{m-1} - g_m}}{s_m} + \frac{e^{x_m - g_m}}{s_m} \times \vec{V}_m.
\end{aligned}
```

这其实就是 [FlashAttention §3.1](https://arxiv.org/html/2205.14135#S3.SS1) 里按 block 做 rescaling 的方法，只不过这里每次只处理一个 key。

## 合并两个循环

循环（1）和优化后的循环（2）思路一样：在循环里算中间值，只保证最终结果正确。所以可以把它们合并成一个循环。写成矩阵形式，同一个循环里有四步：

**1. Score**

```katex
\mathbb{X}[n,m] = \mathbb{Q}[n,:] \cdot \mathbb{K}^T[:,m]
```

**2. Max**

```katex
\begin{aligned}
\mathbb{G}[n,1] &= \mathbb{X}[n,1], \\
\mathbb{G}[n,m] &= \max(\mathbb{G}[n,m-1], \mathbb{X}[n,m]).
\end{aligned}
```

**3. Sum**

```katex
\begin{aligned}
\mathbb{S}[n,1] &= 1, \\
\mathbb{S}[n,m] &= \mathbb{S}[n,m-1] \times e^{\mathbb{G}[n,m-1] - \mathbb{G}[n,m]} + e^{\mathbb{X}[n,m] - \mathbb{G}[n,m]}.
\end{aligned}
```

**4. Attention**

```katex
\begin{aligned}
\mathbb{A}_1[n,:] &= \frac{e^{\mathbb{X}[n,1] - \mathbb{G}[n,1]}}{\mathbb{S}[n,1]} \times \mathbb{V}[1,:], \\
\mathbb{A}_m[n,:] &= \mathbb{A}_{m-1}[n,:] \times \frac{\mathbb{S}[n,m-1] \times e^{\mathbb{G}[n,m-1] - \mathbb{G}[n,m]}}{\mathbb{S}[n,m]} + \frac{e^{\mathbb{X}[n,m] - \mathbb{G}[n,m]}}{\mathbb{S}[n,m]} \times \mathbb{V}[m,:].
\end{aligned}
```

用 Python 表示（不含 scaling 和 masking）：

```python
matrix_q = [[random.random() for _ in range(D)] for _ in range(N)]
matrix_k = [[random.random() for _ in range(D)] for _ in range(M)]
matrix_v = [[random.random() for _ in range(D)] for _ in range(M)]
matrix_a = [[0.0] * D for _ in range(N)]

for n in range(N):
    for m in range(M):
        x = 0.0
        for d in range(D):
            x += matrix_q[n][d] * matrix_k[m][d]

        g = max(g_prev, x) if m > 0 else x
        e = math.exp(x - g) if m > 0 else 1.0
        s = s_prev * math.exp(g_prev - g) + e if m > 0 else 1.0

        for d in range(D):
            if m > 0:
                matrix_a[n][d] = (matrix_a[n][d] * s_prev * math.exp(g_prev - g) + e * matrix_v[m][d]) / s
            else:
                matrix_a[n][d] = e * matrix_v[0][d] / s
        g_prev = g
        s_prev = s
```

最后和直接计算的结果对比一下：

```python
for n in range(N):
    scores = [sum(q * k for q, k in zip(matrix_q[n], key)) for key in matrix_k]
    max_x = max(scores)
    sum_ex = sum(math.exp(x - max_x) for x in scores)
    for d in range(D):
        expected = sum(math.exp(x - max_x) / sum_ex * matrix_v[m][d] for m, x in enumerate(scores))
        assert math.isclose(matrix_a[n][d], expected)
```

## 从循环到 tiling

上面的循环解释了为什么 softmax 可以和矩阵乘法融合，但每次只处理一个 key，矩阵数据还没有得到充分复用。这就要靠 tiling。

一种设计方法是把一个 query tile 和它对应的行状态（G、S、A 中对应的行）留在片上，然后逐个读入 key/value tile。每读入一个 tile，先算局部的 score，更新每行的最大值和指数和，再算局部的加权和，同时修正旧的输出。这个 tile 的 score 和 weight 用完就丢掉，下一个 tile 接着用更新后的状态。

这样安排的话，每换一个 query tile，就要把 key/value tile 再访问一遍。所以"一个 query tile 扫完所有 key”并不等于“所有输入只从外部内存读一次”。原始 FlashAttention 的循环顺序正好相反：key/value tile 在外层，query/output tile 被反复读写。实际的内存流量取决于 tile 大小、循环顺序和缓存（[FlashAttention，Algorithm 1 与 §3.2](https://arxiv.org/html/2205.14135#S3)）。

还可以再省一点计算：不在每一步都除以 s，而是保留 A 的分子（也就是 S × A），每步只做 rescale 和累加，最后一步再除以 s。[FlashAttention-2](https://arxiv.org/html/2307.08691#S3.SS1.SSS1) 就用这个办法减少了非矩阵运算。最大值变化时，分子仍然要 rescale。

## 留给实现的问题

1. 真正做硬件实现时，还有很多事要决定：这些状态放在哪里，反馈更新怎么调度，矩阵运算和归一化之间怎么交换数据。

2. Masking 也要单独处理。Mask 本身是 element-wise 操作，但如果一行的前缀全被 mask 掉，最大值就是负无穷，负无穷减负无穷没有定义，上面的初始化就不能直接用了。

3. 另外，数学上等价不代表浮点结果逐位相同，计算顺序变了，结果不一定一模一样。



> 笔者：整个推导的核心只有一个思路：**只要最终结果正确，中间结果可以换一种含义。Online softmax 用它处理分母，FlashAttention 再把它用到输出上。**
