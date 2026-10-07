# Jim's technical writing: distilled style notes

## Source and scope

This guide distills the user-provided `handoff.md` and five canonical articles read from the existing checkout. Local Markdown avoids a network dependency at skill runtime. Samples show reasoning and voice; their technical claims are not automatically current facts, and they must not supply opinions for unrelated new articles.

| Sample | Repository source | Pattern to learn |
| --- | --- | --- |
| Trust | [思考：建立信任的几种方式](../../../../content/posts/thoughts/思考-建立信任的几种方式-how-to-gain-trust.md) | Separate structural incentives from interpersonal trust, then derive practical actions. |
| Research vs Engineering | [思考：研究与工程](../../../../content/posts/thoughts/思考-研究与工程-thoughts-about-research-and-engineering.md) | Name the dominant constraint, compare organizational mechanisms, and retain ownership as a shared requirement. |
| Over-communication | [思考：过度沟通](../../../../content/posts/thoughts/思考-过度沟通-over-communication.md) | Connect specific human limitations to concrete practices such as pre-reading time, checklists, and documentation ownership. |
| Huwcha Accelerator Architecture | [Huwcha Accelerator architecture](../../../../content/posts/architecture/huwcha-accelerator-architecture.md) | Dense hierarchical architecture notes, quantitative details, inline skepticism, and unanswered questions. |
| Software Is King, Especially in AI | [Software is King, Especially in AI](../../../../content/posts/thoughts/software-is-king-especially-in-ai.md) | State a strong personal thesis, explain system-level tradeoffs, and derive a personal engineering judgment. |

Public versions use `https://jimwang99.github.io/posts/` plus the topic and filename stem with a trailing slash. The repository preserves the title spelling “Huwcha”; the cited architecture manual is Hwacha. Do not silently rename historical paths.

## Reasoning over imitation

The common pattern is high information density, a strong logical skeleton, and little decoration. Jim is not uniformly a short-sentence writer. A long paragraph is useful if it advances one technical argument.

Start with the concrete problem or supported judgment. Identify the main contradiction or dominant constraint. Explain the mechanism, compare the available alternatives, and derive implications. Numbers, assumptions, and limits belong next to the claim they qualify.

In “Trust,” the incentives of the parties constrain what interpersonal trust can achieve. In “Research vs Engineering,” execution efficiency and innovation/quantitative evaluation lead to different processes and organizational structures. In “Software Is King,” flexibility and optimization benefits are paired with specialization and debugging costs. Preserve this habit of linking a recommendation to a mechanism and its tradeoffs.

Technical notes need not become essays. The accelerator article uses nested bullets for caches, queues, execution units, and prefetch behavior, with comments such as “why is that necessary?” Those questions and doubts are part of the reasoning, not rough edges to polish away.

## Voice and language

Write as an experienced system architect addressing technically competent readers. Be direct, analytical, practical, and comfortable with strong sourced judgments. Keep personal perspective without adding autobiography.

Natural first-person forms include 我认为, 我的理解是, 我更关心的是, 我不认为, 一个问题是, 这里比较有意思, 我原来的判断是, and 这次实验进一步加强了这个判断. Use them when the source contains the relevant perspective; do not add certainty merely to sound assertive.

Chinese-English mixing is normal when it improves precision. Do not mechanically translate system architecture, compiler, runtime, speculative decoding, KV cache, bandwidth, throughput, prefill, decode, quantization, ownership, or tech lead. Keep metric names consistent with the source.

Functional headings include 为什么？, 怎么做？, System architecture, Decoupling, Why does this matter?, My Answer, and Experiment Setup. Avoid ceremonial headings such as 一个新时代正在到来, 不容忽视的巨大变化, 重新想象未来, and 写在最后.

## Epistemic distinctions

| Level | What it means | Editing obligation |
| --- | --- | --- |
| Fact | Externally verifiable claim | Keep provenance; verify or qualify when necessary. |
| Measurement | Result produced by an experiment | Retain units, setup, method, and scope; say whether it is reported or reproduced. |
| Observation | What happened | Keep it separate from an explanation of why. |
| Interpretation | Jim's explanation | Attribute it and preserve uncertainty. |
| Judgment | Jim's technical or architectural conclusion | Keep its reasoning and limits; do not substitute the editor's view. |
| Hypothesis | Claim needing validation | Keep it provisional and state what evidence is missing. |

An observation is not proof. A hypothesis is not a conclusion. One benchmark may strengthen an existing view without establishing a universal result. When causal attribution lacks controls, say so.

## Remove padding

Remove these as generic filler in newly drafted prose:

- 值得注意的是
- 不难发现
- 众所周知
- 毋庸置疑
- 在人工智能快速发展的今天
- 随着技术的不断发展
- 让我们深入探讨
- 这不仅仅是……更是……
- 为我们提供了新的思考
- 具有重要意义
- 赋能
- 颠覆
- 革命性
- 未来可期
- 综上所述

Also remove fake excitement, clickbait, empty transition paragraphs, inspirational conclusions, fake quotations, repeated thesis statements, unnecessary recaps, and ornamental three-part phrasing. Do not explain expert basics unless the argument requires it. LinkedIn endings such as “What do you think?”, “Agree?”, and “Thoughts?” are engagement bait; a specific unresolved technical question can be useful.

This is semantic editing, not a blind string blacklist. Preserve literal quotations or a discussion of a term when needed. Historical samples occasionally contain general openings, emphatic phrasing, or recap headings. Follow the handoff's explicit editing preferences instead of copying every historical surface feature.

## Platform adaptation

The blog is the canonical technical account with no fixed length limit. WeChat typically targets 1,200–2,500 Chinese characters and can add necessary context without becoming popular science. LinkedIn typically targets 200–500 English words, one central idea, and the strongest evidence. These are defaults, not permission to remove a material caveat or change a measurement.
