---
title: "Understanding FlashAttention Through Its Running State"
date: 2026-10-09
draft: true
---

I understand FlashAttention through its running state: what each query row carries from one key to the next. The key step is to change what the intermediate output means. Instead of a partial sum over final probabilities, it becomes the attention result for the keys processed so far. The final result still matches the attention definition, and attention can be accumulated as scores arrive, without retaining the full score or probability matrix. Tiling then maps this recurrence onto on-chip memory so that matrix operands are reused. This is how online normalization connects to the IO-aware algorithm in the [FlashAttention paper](https://arxiv.org/abs/2205.14135).

I derive the forward computation from safe softmax, then extend the running state to the attention output and to tiles. The Python blocks run in order with only the standard library. They illustrate the mathematics; they are not GPU kernels or performance measurements.

## Start with the attention definition

For one batch item and one attention head, scaled dot-product attention is:

```katex
A = \operatorname{softmax}\left(\frac{QK^T}{\sqrt{d}}\right)V
```

This is the definition in [Attention Is All You Need, §3.2.1](https://arxiv.org/html/1706.03762#S3.SS2.SSS1), without masking. I use `d` for the head width so that `K` always means the key matrix.

| Symbol | Meaning | Shape |
| --- | --- | --- |
| Q | Queries | `[N, d]` |
| K | Keys | `[M, d]` |
| V | Values | `[M, d]` |
| X | Scaled scores | `[N, M]` |
| P | Probabilities, normalized along each row | `[N, M]` |
| A | Attention output | `[N, d]` |

For simplicity, values have the same width as queries and keys; if the value width differs, the output takes the value width. Each batch item and head is an independent calculation, and these shapes describe one of them, following the [Transformer's attention and multi-head definitions](https://arxiv.org/html/1706.03762#S3.SS2). In full-sequence self-attention, the query and key lengths match. In single-token decode, the query length is one, while the keys include the cached history.

The scale factor keeps score magnitude under control as the head width grows. If query and key components are independent with zero mean and unit variance (an illustrative assumption), their dot product has variance `d`, and dividing by its square root restores unit variance. This helps avoid a saturated softmax with very small gradients. Applied after the dot product, as written in the formula, the scaling cannot prevent overflow inside the dot product. [Attention Is All You Need, §3.2.1](https://arxiv.org/html/1706.03762#S3.SS2.SSS1)

The derivation assumes nonempty inputs, matching dimensions, and finite scores. Masking needs extra handling, discussed at the end.

## Safe softmax and its dependency

Consider a score row with `M` elements. Numerically stable softmax subtracts the row maximum before exponentiation:

```katex
\begin{aligned}
g_M &= \max_{1 \leq j \leq M} x_j, \\
s_M &= \sum_{j=1}^{M} e^{x_j-g_M}, \\
p_i &= \frac{e^{x_i-g_M}}{s_M}.
\end{aligned}
```

Subtracting a finite constant shared by the whole row leaves softmax unchanged, because the exponential factor cancels between numerator and denominator. Choosing the maximum makes every exponent nonpositive, so finite scores cannot overflow the exponential. Accumulation precision and underflow still depend on the numeric format.

A straightforward implementation makes three logical scans over the row: find the maximum, sum the exponentials, then emit normalized probabilities, as in [Online normalizer calculation for softmax, Algorithm 2](https://arxiv.org/html/1805.02867#S2). Three logical scans are not necessarily three reads from external memory; a short row may stay on chip.

The equations show the dependency: every probability needs the final maximum and denominator, and both depend on the whole row.

## Online softmax: rescale the old sum

Instead of waiting for the final maximum, keep the maximum and the exponential sum for the prefix seen so far:

```katex
g_i = \max_{1 \leq j \leq i} x_j,
\qquad
s_i = \sum_{j=1}^{i} e^{x_j-g_i}.
```

The sum is tied to its reference maximum. When a new score raises the maximum, the existing sum must be re-expressed relative to the new one:

```katex
\begin{aligned}
g_i &= \max(g_{i-1}, x_i), \\
\alpha_i &= e^{g_{i-1}-g_i}, \\
w_i &= e^{x_i-g_i}, \\
s_i &= \alpha_i s_{i-1} + w_i.
\end{aligned}
```

This is the running normalizer in [Online normalizer calculation for softmax, Algorithm 3](https://arxiv.org/html/1805.02867#S3). Expanding the old contribution shows why the correction works:

```katex
\begin{aligned}
\alpha_i s_{i-1}
&= e^{g_{i-1}-g_i}\sum_{j=1}^{i-1}e^{x_j-g_{i-1}} \\
&= \sum_{j=1}^{i-1}e^{x_j-g_i}.
\end{aligned}
```

Adding the new term keeps the prefix definition. Start with `g_1 = x_1` and `s_1 = 1`; at the end of the row, these become the final maximum and denominator. The subscripts index the history, but execution keeps only the previous state.

Here is a direct implementation next to the conventional calculation:

```python
import math
import random


def stable_softmax(scores):
    maximum = max(scores)
    normalizer = sum(math.exp(score - maximum) for score in scores)
    return [math.exp(score - maximum) / normalizer for score in scores]


def online_softmax(scores):
    maximum = scores[0]
    normalizer = 1.0
    for index in range(1, len(scores)):
        score = scores[index]
        next_maximum = max(maximum, score)
        normalizer = (
            normalizer * math.exp(maximum - next_maximum)
            + math.exp(score - next_maximum)
        )
        maximum = next_maximum
    return [math.exp(score - maximum) / normalizer for score in scores]


scores = [0.0, 2.0, 1.0]
assert all(
    math.isclose(actual, expected)
    for actual, expected in zip(online_softmax(scores), stable_softmax(scores))
)
```

Online normalization merges the maximum and sum scans. Producing the probabilities still needs the final list comprehension, a second scan over the retained scores, because a probability for an early element cannot be final before later scores arrive. The original online-softmax algorithm keeps this output pass. [Algorithm 3](https://arxiv.org/html/1805.02867#S3) Attention offers a way to consume those probabilities without emitting them one by one.

## Extend the state to the attention output

For a fixed query row, let `v_i` be the value vector for key `i`. The output is a weighted sum of vectors:

```katex
a_M = \sum_{i=1}^{M} p_i v_i
    = \frac{\sum_{i=1}^{M}e^{x_i-g_M}v_i}{s_M}.
```

This vector form comes from swapping the key loop and the output-component loop of the matrix multiplication. Each key's weight updates every component of the output row and is then discarded. We keep a row of partial sums instead of computing output elements one at a time.

Using final probabilities, however, still requires `g_M` and `s_M`. Without retained scores, computing the normalizer first and the weighted sum second would mean computing the scores twice.

The useful change is to give the intermediate output a different meaning. Define `a_i` as the attention result over the prefix through key `i`:

```katex
a_i = \frac{\sum_{j=1}^{i}e^{x_j-g_i}v_j}{s_i}.
```

This is a complete, normalized answer for the prefix, and it may change as more keys arrive. It need not equal a partial sum of final probabilities. At the last key, the prefix is the whole row, so `a_M` is the required output.

The old weighted numerator is `s_(i-1) a_(i-1)`. Rescale it to the new maximum, add the new value contribution, and normalize:

```katex
\begin{aligned}
s_i a_i
&= \alpha_i s_{i-1}a_{i-1} + w_i v_i, \\
a_i
&= \frac{\alpha_i s_{i-1}a_{i-1} + w_i v_i}{s_i}.
\end{aligned}
```

The maximum, denominator, and output now advance together under one invariant:

```katex
\begin{aligned}
g_i &= \max_{j \leq i}x_j, \\
s_i &= \sum_{j=1}^{i}e^{x_j-g_i}, \\
s_i a_i &= \sum_{j=1}^{i}e^{x_j-g_i}v_j.
\end{aligned}
```

This is a key-by-key derivation of the rescaling that [FlashAttention, §3.1](https://arxiv.org/html/2205.14135#S3.SS1) applies to attention blocks. The first finite score gives `g_1 = x_1`, `s_1 = 1`, and `a_1 = v_1`. Each later update preserves the invariant by rescaling both the normalizer and the weighted numerator.

| Calculation | Running state for a query row | What must wait until the row ends? |
| --- | --- | --- |
| Online softmax | Maximum and normalizer | Emitting final probabilities |
| Online attention | Maximum, normalizer, and output vector | Finalizing the output vector |

Attention no longer waits for the final denominator before accumulating values. Successive state updates still depend on each other; fusing the loop does not remove that feedback.

## A runnable attention example

This function applies the score scaling inside the dot product. Inputs are Python lists with the shapes above, and values have the same width as queries. It computes unmasked attention with finite scores.

```python
def online_attention(queries, keys, values):
    width = len(queries[0])
    scale = math.sqrt(width)
    result = []

    for query in queries:
        maximum, normalizer = -math.inf, 0.0
        output = [0.0] * width

        for key, value in zip(keys, values):
            score = sum(q * k for q, k in zip(query, key)) / scale
            next_maximum = max(maximum, score)
            rescale = math.exp(maximum - next_maximum)
            weight = math.exp(score - next_maximum)
            next_normalizer = rescale * normalizer + weight

            output = [
                (rescale * normalizer * previous + weight * component)
                / next_normalizer
                for previous, component in zip(output, value)
            ]
            maximum, normalizer = next_maximum, next_normalizer

        result.append(output)

    return result
```

The initial state `(-inf, 0, zero_vector)` works because the first finite score makes `rescale` zero and `weight` one. The prefix output becomes the first value vector, matching the explicit initialization above.

To check the recurrence, compare it with a dense calculation that builds every score and probability row. The dimensions and random inputs are illustrative, not a benchmark workload.

```python
def dense_attention(queries, keys, values):
    width = len(queries[0])
    result = []
    for query in queries:
        scores = [
            sum(q * k for q, k in zip(query, key)) / math.sqrt(width)
            for key in keys
        ]
        probabilities = stable_softmax(scores)
        result.append([
            sum(probability * value[column]
                for probability, value in zip(probabilities, values))
            for column in range(width)
        ])
    return result


rng = random.Random(1)
query_count, key_count, width = 2, 5, 4
queries = [[rng.uniform(-1, 1) for _ in range(width)]
           for _ in range(query_count)]
keys = [[rng.uniform(-1, 1) for _ in range(width)]
        for _ in range(key_count)]
values = [[rng.uniform(-1, 1) for _ in range(width)]
          for _ in range(key_count)]

actual = online_attention(queries, keys, values)
expected = dense_attention(queries, keys, values)
assert len(actual) == query_count
assert all(len(row) == width for row in actual)
assert all(
    math.isclose(a, b, rel_tol=1e-12, abs_tol=1e-12)
    for actual_row, expected_row in zip(actual, expected)
    for a, b in zip(actual_row, expected_row)
)
```

This check uses Python floating-point arithmetic and does not establish an FP16 or BF16 error bound. Exact attention means computing the same mathematical function; reordered floating-point operations need not give bit-identical results.

## From the recurrence to tiles

The scalar loop explains fusion; efficient reuse of matrix operands also needs tiling. One possible schedule keeps a query tile and its row state on chip while visiting key/value tiles, which makes the state from the derivation explicit in the memory schedule.

Let the query tile have `B_q` rows and the current key/value tile have `B_k` rows. The scaled score tile is:

```katex
X = \frac{Q_{\mathrm{tile}}K_{\mathrm{tile}}^T}{\sqrt{d}}.
```

The score tile has shape `[B_q, B_k]`. The running statistics `g` and `s` each have shape `[B_q]`, and the output accumulator `A` has shape `[B_q, d]`. The scalar recurrence extends to a tile as:

```katex
\begin{aligned}
g' &= \max(g, \operatorname{rowmax}(X)), \\
\alpha &= e^{g-g'}, \\
P &= e^{X-g'[:,\mathrm{None}]}, \\
s' &= \alpha \odot s + \operatorname{rowsum}(P), \\
A' &= \operatorname{diag}(1/s')\left[
  \operatorname{diag}(\alpha \odot s)A + PV_{\mathrm{tile}}
\right].
\end{aligned}
```

Operations on row statistics are elementwise, `[:, None]` broadcasts a row statistic across columns, and `diag` turns a vector into a diagonal scaling matrix. The tile's `P` holds unnormalized exponential weights; the maximum and sum updates determine how its weighted values combine with the old output. This is the blockwise rescaling described in [FlashAttention, §3.1](https://arxiv.org/html/2205.14135#S3.SS1).

After each tile, discard its scores and weights and keep the updated row state. After the last key/value tile, write the output tile. Each loaded key/value tile serves every query row in the active query tile.

This schedule revisits key/value tiles for each new query tile, so a sweep over the keys for one query tile does not guarantee that every operand is read from external memory once. Actual traffic depends on tile capacity, loop order, and caching. The original FlashAttention algorithm nests the loops the other way: key/value tiles are outermost, and query/output tiles are revisited. Both orders show that the recurrence and the memory schedule are separate parts of the explanation. [FlashAttention, Algorithm 1 and §3.2](https://arxiv.org/html/2205.14135#S3)

### Postpone normalization

The normalized accumulator makes the invariant easy to see, but it divides the output on every update. Instead, keep the unnormalized numerator `U = diag(s) A`:

```katex
\begin{aligned}
U' &= \operatorname{diag}(\alpha)U + PV_{\mathrm{tile}}, \\
A_{\mathrm{final}} &= \operatorname{diag}(1/s_{\mathrm{final}})U_{\mathrm{final}}.
\end{aligned}
```

Division now happens once, after the last tile. [FlashAttention-2, §3.1.1](https://arxiv.org/html/2307.08691#S3.SS1.SSS1) uses this change to reduce non-matrix arithmetic. The numerator still needs rescaling whenever the running maximum changes.

## What the derivation leaves to the implementation

Masking cannot be dropped into the example's initialization unchanged. A masked prefix may contain only negative-infinite scores, and subtracting its maximum is then undefined. An implementation must handle empty or fully masked prefixes and choose a convention for a fully masked output row.

For a vector engine, the remaining questions are where the row state and tiles live, how the feedback updates are scheduled, and how the matrix products exchange data with normalization. The equations specify those dependencies; they do not choose tile sizes, a hardware pipeline, or a numeric format.

The step that makes this work is the new meaning of the intermediate output. Because the state holds the answer for the prefix processed so far, earlier contributions can be corrected as new scores arrive. That running state makes fusion possible; tiling decides how an implementation uses it to reduce memory traffic.
