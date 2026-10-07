# Examples and source excerpts

These examples illustrate behavior, not new evidence or Jim's current opinions. Short quotations below are exact excerpts from the checked-out canonical posts; synthetic examples are explicitly labeled.

## Source excerpts

### Dominant constraint: Research vs Engineering

> **工程实现**的主要矛盾是执行效率。

The article links that constraint to deliverables, quantifiable quality, and process. Copy the reasoning pattern, not the opinion into an unrelated piece.

### A structural limit: Trust

> 利益问题是根本的，与组织架构和项目本身的性质有关，很难短时间内由个人左右。

This keeps incentives visible when discussing trust. Recommendations do not erase the constraint.

### Concrete intervention: Over-communication

> 会议开始后单独辟出10～15分钟，用来给参会人员阅读资料。

Retain the concrete time range instead of replacing it with “allow sufficient time.” It is a recommendation in this source, not a measurement of efficacy.

### Unresolved skepticism: Huwcha Accelerator Architecture

> JW: why is that necessary?

An editor should preserve an unanswered architecture question rather than supplying an unsupported explanation.

### System tradeoff: Software Is King, Especially in AI

> The trade-off is the techniques used in optimization become more specific and tied to applications when moving up the layers.

A strong judgment can coexist with a limit. Do not drop the specialization cost while retaining only the performance benefit.

## Analysis before drafting: synthetic benchmark fixture

Input:

> I tried a local coding-agent stack. I saw 7 tok/s before optimization. After adding DeepFlash 2 and speculative decoding, I measured 34 tok/s at long context and 58 tok/s at short context. This strengthens my previous view that medium-size local models may be usable for constrained tasks once the inference stack crosses a usability threshold.

Appropriate first response:

```markdown
## Central claim
These results strengthen your existing hypothesis that medium-size local models may become usable for constrained coding tasks when the inference stack reaches sufficient performance. They do not establish a general conclusion about local models.

## Evidence
- Reported baseline: 7 tok/s; context length and other conditions are unspecified.
- Reported after optimization: 34 tok/s at long context; 58 tok/s at short context.
- The stack changed with DeepFlash 2 and speculative decoding together; the notes do not isolate their individual contributions.
- Model, hardware, quantization, exact context lengths, metric definition, batch size, measurement method, repeatability, and task quality are not supplied.

## Reasoning
Higher reported throughput could reduce waiting time in this workflow. Whether that crosses a usability threshold depends on workload, end-to-end latency, and task quality, none of which is established here. This is supporting evidence for a prior view, not proof of it.

## Weak points
The baseline may not match either after-optimization workload. Do not derive a speedup without comparable conditions. Throughput alone does not demonstrate coding-agent usefulness or causally identify which optimization mattered.

## Possible angles

### Angle 1
Title: When a local coding stack becomes usable
Thesis: Performance may cross a practical usability threshold for a constrained workflow; these measurements suggest a candidate case to investigate.
Why it is interesting: It connects a concrete result to the author's existing hypothesis without treating usability as measured.

### Angle 2
Title: 7, 34, and 58 tok/s: what the numbers establish
Thesis: The reported results justify a narrower discussion of this stack, while missing baseline conditions limit comparison.
Why it is interesting: It preserves the observations and makes the measurement limits explicit.

### Angle 3
Title: Stronger evidence for an existing view of local models
Thesis: This experiment reinforces, rather than originates or proves, the author's constrained-workload hypothesis.
Why it is interesting: It separates a prior judgment from the new evidence and the remaining validation work.
```

Stop here and invite an angle selection. Do not append a full article. These figures belong only to this synthetic fixture; do not transplant them into a real article.

## Preserve uncertainty: synthetic rewrite

Overclaim:

> This experiment proves that small models are the future.

Faithful revision when the source supplies that prior hypothesis:

> This strengthens my previous view: a medium-size local model with an optimized inference stack may be useful for a constrained workload. One experiment does not establish how broadly that holds.

Do not change “small” to “medium-size” unless the actual source establishes the model category. This example uses the medium-size category from the fixture above.

## Technical Chinese: synthetic cleanup

Padded draft:

> 随着技术的不断发展，值得注意的是，优化后 long context 的吞吐为 34 tok/s，short context 为 58 tok/s。这不仅仅是速度的提升，更是具有重要意义的革命性突破。综上所述，未来可期。

Edited:

> 优化后，long context 的吞吐为 34 tok/s，short context 为 58 tok/s。

The source gives no basis for “breakthrough,” no matched baseline, and no causal explanation. Remove those claims without inventing replacements.

## Technical note: synthetic unresolved mechanism

Input:

> KV cache disaggregation separates prefill and decode. I don't yet know whether the transfer cost dominates for our workload. I haven't measured it.

Faithful note after the user selects this angle:

```markdown
## Setup
- Separate prefill and decode; transfer the KV cache between them.
- No transfer-cost measurements for this workload yet.

## Question
- Does KV cache transfer cost dominate the potential benefit for this workload?
```

Do not invent bandwidth, speedup, hardware, transfer overlap, or a claim that disaggregation is worthwhile.
