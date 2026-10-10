I find FlashAttention easiest to understand through one question: what state must survive after each score or tile is processed?

The key idea is that an intermediate output can change meaning, as long as the final result still matches the attention definition.

Start with online softmax. Keep a running maximum and an exponential sum relative to that maximum. When a new score raises the maximum, rescale the old sum before adding the new term. Producing final probabilities still requires the normalizer of the complete row. [Online normalizer calculation for softmax](https://arxiv.org/abs/1805.02867)

Attention lets us extend that state. Alongside the maximum and normalizer, keep a weighted-value accumulator for the keys processed so far. When the maximum changes, rescale its old contribution, add the new value contribution, and normalize.

That accumulator is the attention answer for the current prefix. It can change as more keys arrive. At the last key, the prefix is the whole row, so the accumulator becomes the required output.

This links the algebra to the memory behavior in [FlashAttention](https://arxiv.org/abs/2205.14135): scores and weights are consumed locally and discarded, while the row state carries the computation forward. Tiling then reuses the matrix operands in on-chip memory.

Two limits remain. Successive state updates still depend on each other. And the fused recurrence does not guarantee that every input is read from external memory only once: the sweep over keys may repeat for each query tile, so memory traffic depends on capacity and scheduling.

For a vector engine, that leaves concrete questions: where the state lives, how the updates are scheduled, and how matrix products exchange data with normalization. The derivation exposes those dependencies; it does not choose the hardware mapping or promise a speedup.
