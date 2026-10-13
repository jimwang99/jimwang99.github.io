---
title: "Understanding FlashAttention"
date: 2026-10-09
draft: false
---

## TL;DR

I find FlashAttention easiest to understand through one question: what state must survive after each score or tile is processed?

The key idea is that an intermediate output can change meaning, as long as the final result still matches the attention definition.

Start with online softmax. Keep a running maximum and an exponential sum relative to that maximum. When a new score raises the maximum, rescale the old sum before adding the new term. Producing final probabilities still requires the normalizer of the complete row. [Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)

Attention lets us extend that state. Alongside the maximum and normalizer, keep a weighted-value accumulator for the keys processed so far. When the maximum changes, rescale its old contribution, add the new value contribution, and normalize.

That accumulator is the attention answer for the current prefix. It can change as more keys arrive. At the last key, the prefix is the whole row, so the accumulator becomes the required output.

This links the algebra to the memory behavior in [FlashAttention](https://arxiv.org/abs/2205.14135): scores and weights are consumed locally and discarded, while the row state carries the computation forward. Tiling then reuses the matrix operands in on-chip memory.

Two limits remain. Successive state updates still depend on each other. And the fused recurrence does not guarantee that every input is read from external memory only once: the sweep over keys may repeat for each query tile, so memory traffic depends on capacity and scheduling.

For a vector engine, that leaves concrete questions: where the state lives, how the updates are scheduled, and how matrix products exchange data with normalization. The derivation exposes those dependencies; it does not choose the hardware mapping or promise a speedup.

<!--more-->

## Introduction

Softmax is an important part of the Transformer. Its own arithmetic is small, but its mathematical data dependency means that the straightforward method reads the data three full times, which takes a lot of time.

NVIDIA's paper "[Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)" introduced online softmax: it does a little more computation in exchange for one fewer read, reducing three passes to two.

[FlashAttention](https://arxiv.org/abs/2205.14135) applies a similar idea and goes one step further. It merges softmax and the following multiplication by V into one loop, so the full score and probability matrices are never written back to memory (DDR or HBM). Tiling then keeps data in the GPU's on-chip memory for reuse.

Below I derive it step by step. The equations use only simple algebra. The Python blocks run in order with only the standard library; they illustrate the mathematics and are not GPU kernels or performance measurements.

## Softmax

First, softmax operates on a one-dimensional vector `x`, not on a multidimensional tensor.

```katex
\mathrm{softmax}(\vec{x})_i = \frac{e^{x_i}}{\sum_{j=1}^{N} e^{x_j}}
```

The calculation has two steps: (1) compute `e^x` for every `x` and add them up; (2) divide.

### Safe softmax

But `e^x` grows quickly. It overflows even for moderately large `x`, especially in float16 or lower precision. So we usually subtract the maximum from every `x` first. This is safe softmax:

```katex
\mathrm{softmax}(\vec{x})_i = \frac{e^{x_i - \max(\vec{x})}}{\sum_{j=1}^{N} e^{x_j - \max(\vec{x})}}
```

The numerator and denominator are multiplied by the same factor, so the result does not change. After the subtraction, no exponent is greater than zero, so finite inputs cannot overflow.

Safe softmax therefore reads the data three times: (1) find the maximum; (2) sum; (3) divide, as in [Online normalizer calculation for softmax, Algorithm 2](https://arxiv.org/html/1805.02867#S2). Strictly speaking, these are three logical scans. If a row is short enough to stay on chip, it is not necessarily read from DDR three times.

In Python:

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

Steps (1) and (2) of these three passes can be merged: find the maximum while summing.

Suppose we build two arrays `G` and `S`, the same length as `x`:

```katex
g_i = \max(x_1, \dots, x_i), \qquad
s_i = \sum_{j=1}^{i} e^{x_j - g_i}
```

In other words, `g_i` is the maximum up to element `i`, and `s_i` is a sum **similar to** the softmax denominator. **Except for the last one, the values in `S` all differ from the sum computed in softmax's second step; but at the last element, `s_N` equals the softmax denominator exactly.** So one sequential read of `x`, computing `G` and `S` along the way, completes steps (1) and (2).

I use `g` (greatest) for the maximum because `m` is reserved for the key index later, and `s` for the sum.

> Author's note: this approach reminds me of dynamic programming.

`S` can be computed with a recurrence:

```katex
\begin{aligned}
s_1 &= 1, \\
s_i &= s_{i-1} \times e^{g_{i-1} - g_i} + e^{x_i - g_i}.
\end{aligned}
```

Whenever the maximum grows, the old sum is first multiplied by `e^(g_(i-1) - g_i)` to express it relative to the new maximum, and then the new term is added. This is the running normalizer in [Online normalizer calculation for softmax, Algorithm 3](https://arxiv.org/html/1805.02867#S3). Expanding it proves that the recurrence satisfies the definition above, so `s_N` is the softmax denominator:

```katex
\begin{aligned}
s_i &= e^{g_{i-1} - g_i} \sum_{j=1}^{i-1} e^{x_j - g_{i-1}} + e^{x_i - g_i} \\
&= \sum_{j=1}^{i-1} e^{x_j - g_i} + e^{x_i - g_i} \\
&= \sum_{j=1}^{i} e^{x_j - g_i}.
\end{aligned}
```

In Python:

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

**Online softmax merges finding the maximum and summing into one pass. But to output the softmax, it still has to wait for the final maximum and denominator, so it reads `x` once more to divide. That is how three passes become two.**

## Attention

```katex
\mathbb{A} = \mathrm{softmax}\left(\mathrm{mask}\left(\frac{\mathbb{Q} \cdot \mathbb{K}^T}{\sqrt{D}}\right)\right) \cdot \mathbb{V}
```

Here A, Q, K, and V are all two-dimensional matrices with shapes `[N, D]`, `[N, D]`, `[M, D]`, and `[M, D]`, where `D` is head_dim. In full-sequence self-attention, `N == M`; when decoding one token, `N = 1`, while `M` includes the history in the KV cache. `mask()` implements causal masking and other kinds of masking. It is an elementwise operation that does not affect the derivation below, so I skip it for now and come back at the end to what needs care.

**Why divide by √D?** This also controls the numeric range. If every component of q and k is independent with mean 0 and variance 1, their dot product has variance D ([Attention Is All You Need, §3.2.1](https://arxiv.org/html/1706.03762#S3.SS2.SSS1)). After dividing by √D, the variance returns to 1, so the softmax distribution is not too extreme, gradients do not become too small, and training is more stable.

**Simplification 1:** 1/√D is a constant. The scaling is usually applied to Q or K before the dot product, which also makes the dot product itself less likely to overflow. I leave it out from here on.

**Simplification 2:** I also leave out masking from here on. Different attention architectures use different masks, but every mask is a constant operation that does not depend on the scores.

After these simplifications, with X and Y for the intermediate values, attention can be written as:

```katex
\mathrm{softmax}(\mathbb{Q} \cdot \mathbb{K}^T) \cdot \mathbb{V} = \mathrm{softmax}(\mathbb{X}) \cdot \mathbb{V} = \mathbb{Y} \cdot \mathbb{V} = \mathbb{A}
```

`X` and `x` denote the softmax input, consistent with the sections above; `Y` and `y` denote the softmax result (unfortunately, `s` is already taken); `A` denotes the attention result.

> **Note:** In an LLM, the batch_size and num_head dimensions only repeat independent attention calculations. For each calculation, `N` and `M` depend on the sequence length and are dynamic at runtime, while `D` is head_dim and is static at compile time. This distinction is very important for performance optimization.

## Applying online softmax to attention

Applying online softmax to attention gives the following two loops.

### Loop (1)

Apply online softmax as is. To avoid confusion, `n`, `m`, and `d` are the indices along the N, M, and D dimensions:

```katex
x_{n,m} = \mathbb{X}[n,m] = \mathbb{Q}[n,:] \cdot \mathbb{K}^T[:,m]
```

Matrix X has shape `[N, M]`, but softmax acts only along its inner dimension; the outer dimension just repeats the same loop. So for simplicity, look at one row of X. `n` is the variable of the outer loop `for n in range(N)`, and `m` is the variable of the inner loop `for m in range(M)`:

```katex
\begin{aligned}
x_m &= \mathbb{Q}[n,:] \cdot \mathbb{K}^T[:,m], \\
g_m &= \max(g_{m-1}, x_m), \\
s_m &= s_{m-1} \times e^{g_{m-1} - g_m} + e^{x_m - g_m}.
\end{aligned}
```

### Loop (2)

Applying a similar idea to `Y · V` gives:

```katex
\begin{aligned}
y_m &= \frac{e^{x_m - g_M}}{s_M}, \\
\vec{A}_0 &= \vec{0}, \\
\vec{A}_m &= \vec{A}_{m-1} + y_m \times \mathbb{V}[m,:].
\end{aligned}
```

Here `V[m, :]` is a row of length D, so `A_m` is a vector, not a scalar. The benefit is that each `y_m` can be discarded right after use, and this form leads directly to FlashAttention.

### How to understand it

If you find this step a bit convoluted, as I did, think of it this way: **it just swaps the inner and outer loops of matrix multiplication and keeps the intermediate results.**

Here are the details. Start with an ordinary matrix multiplication:

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

If we swap loop D and loop M, the result is exactly the same; only the order of computation changes. Instead of computing the elements of A one by one, we keep partial sums for a whole row of A and keep adding to them.

```python
matrix_a2 = [[0.0] * D for _ in range(N)]
for n in range(N):
    for m in range(M):
        for d in range(D):
            matrix_a2[n][d] += matrix_y[n][m] * matrix_v[m][d]

assert matrix_a2 == matrix_a
```

The mathematical expression becomes:

```katex
\mathbb{A}[n,:] = \sum_{m=1}^{M} \mathbb{Y}[n,m] \times \mathbb{V}[m,:]
```

The `y_m` in loop (2) is `Y[n, m]` for row `n`. Writing `V_m = V[m, :]`:

```katex
\mathbb{A}[n,:] = \vec{A}_M = \sum_{m=1}^{M} y_m \times \vec{V}_m = \sum_{m=1}^{M} \frac{e^{x_m - g_M}}{s_M} \times \vec{V}_m
```

## Optimizing loop (2): remove the data dependency and increase parallelism

Loop (2) still has a problem: it cannot start until loop (1) has finished and produced the final `g_M` and `s_M`. This is a classic data dependency; it limits parallelism and slows execution. We can use the same idea as online softmax and turn the computation of `A_M` into a recurrence `A_m = f(A_(m-1))`. The trick is to construct a new `A'_m` that removes this data dependency. We only need its last element to match the target, `A'_M = A_M`; the intermediate values need not be equal.

```katex
\vec{A}'_m = \sum_{i=1}^{m} \frac{e^{x_i - g_m}}{s_m} \times \vec{V}_i
```

When `m = M`:

```katex
\vec{A}'_M = \sum_{i=1}^{M} \frac{e^{x_i - g_M}}{s_M} \times \vec{V}_i = \vec{A}_M
```

Compared with `A_M` above, it looks as if we only replaced `m` with `i` and `M` with `m`. But `A'_m` now means something different: it is the attention result over only the first `m` keys. That is why it can be computed with a recurrence, without writing the intermediate matrix to memory (avoiding materializing the matrix).

Expanding it gives:

```katex
\begin{aligned}
\vec{A}'_1 &= \frac{e^{x_1 - g_1}}{s_1} \times \vec{V}_1 = \vec{V}_1, \\
\vec{A}'_m &= \vec{A}'_{m-1} \times \frac{s_{m-1} \times e^{g_{m-1} - g_m}}{s_m} + \frac{e^{x_m - g_m}}{s_m} \times \vec{V}_m.
\end{aligned}
```

This is the block rescaling in [FlashAttention, §3.1](https://arxiv.org/html/2205.14135#S3.SS1), except that here each step processes one key.

## Merging the two loops

Loop (1) and the optimized loop (2) follow the same idea: compute intermediate values in the loop, and guarantee only that the final result is correct. So they can be merged into one loop. In matrix form, each iteration has four steps:

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

In Python (without scaling or masking):

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

Finally, compare it with a direct calculation:

```python
for n in range(N):
    scores = [sum(q * k for q, k in zip(matrix_q[n], key)) for key in matrix_k]
    max_x = max(scores)
    sum_ex = sum(math.exp(x - max_x) for x in scores)
    for d in range(D):
        expected = sum(math.exp(x - max_x) / sum_ex * matrix_v[m][d] for m, x in enumerate(scores))
        assert math.isclose(matrix_a[n][d], expected)
```

The check uses Python floating-point numbers, so it says nothing about FP16 or BF16 error.

## From loops to tiling

The loop above explains why softmax can be fused with matrix multiplication, but it processes one key at a time, so the matrix data is not yet reused well. That is the job of tiling.

One design keeps a query tile and its row state (the corresponding rows of G, S, and A) on chip, then reads key/value tiles one by one. For each tile, it computes the local scores, updates each row's maximum and exponential sum, then computes the local weighted sum while correcting the old output. The tile's scores and weights are discarded after use, and the next tile continues from the updated state.

For a query tile with `B_q` rows and a key/value tile with `B_k` rows, the score tile has shape `[B_q, B_k]`, the row statistics `g` and `s` each have shape `[B_q]`, and the output `A` has shape `[B_q, D]`. The per-key recurrence extends to a tile as:

```katex
\begin{aligned}
\mathbb{X} &= \mathbb{Q}_{\mathrm{tile}} \cdot \mathbb{K}_{\mathrm{tile}}^T, \\
g' &= \max(g, \operatorname{rowmax}(\mathbb{X})), \\
\alpha &= e^{g-g'}, \\
\mathbb{P} &= e^{\mathbb{X}-g'[:,\mathrm{None}]}, \\
s' &= \alpha \odot s + \operatorname{rowsum}(\mathbb{P}), \\
\mathbb{A}' &= \operatorname{diag}(1/s')\left[
  \operatorname{diag}(\alpha \odot s)\,\mathbb{A} + \mathbb{P} \cdot \mathbb{V}_{\mathrm{tile}}
\right].
\end{aligned}
```

Operations on row statistics are elementwise, `[:, None]` broadcasts a row statistic across columns, and `diag` turns a vector into a diagonal scaling matrix. `P` holds the tile's unnormalized exponential weights.

With this schedule, every new query tile visits the key/value tiles again. So "one query tile sweeps all keys" does not mean "every input is read from external memory only once". The original FlashAttention uses the opposite loop order: key/value tiles are in the outer loop, and query/output tiles are read and written repeatedly. Actual memory traffic depends on tile size, loop order, and caching ([FlashAttention, Algorithm 1 and §3.2](https://arxiv.org/html/2205.14135#S3)).

We can save a little more computation. Instead of dividing by `s` at every step, keep the numerator of A, `U = diag(s) A`, only rescale and accumulate at each step, and divide by `s` after the last step:

```katex
\begin{aligned}
\mathbb{U}' &= \operatorname{diag}(\alpha)\,\mathbb{U} + \mathbb{P} \cdot \mathbb{V}_{\mathrm{tile}}, \\
\mathbb{A}_{\mathrm{final}} &= \operatorname{diag}(1/s_{\mathrm{final}})\,\mathbb{U}_{\mathrm{final}}.
\end{aligned}
```

[FlashAttention-2, §3.1.1](https://arxiv.org/html/2307.08691#S3.SS1.SSS1) uses this method to reduce non-matrix arithmetic. When the maximum changes, the numerator still needs rescaling.

## What is left to the implementation

1. A real hardware implementation still has many decisions to make: where these states live, how the feedback updates are scheduled, and how the matrix operations exchange data with normalization.

2. Masking also needs separate handling. A mask is an elementwise operation, but if a row's prefix is entirely masked, its maximum is negative infinity, and negative infinity minus negative infinity is undefined, so the initialization above cannot be used directly.

3. Mathematical equivalence does not mean bit-identical floating-point results: when the order of computation changes, the results are not necessarily identical.

> Author's note: the whole derivation rests on one idea. **As long as the final result is correct, an intermediate result can take on a different meaning. Online softmax uses it for the denominator; FlashAttention extends it to the output.**
