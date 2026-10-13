# Jim's technical writing: distilled style notes

## Source and scope

This guide distills the user-provided `handoff.md`, canonical articles, and Jim's reviewed Chinese article in the existing checkout. Local Markdown avoids a network dependency at skill runtime. Samples show reasoning and voice; their technical claims are not automatically current facts, and they must not supply opinions for unrelated new articles.

| Sample | Repository source | Pattern to learn |
| --- | --- | --- |
| Trust | [思考：建立信任的几种方式](../../../../content/posts/thoughts/思考-建立信任的几种方式-how-to-gain-trust.md) | Separate structural incentives from interpersonal trust, then derive practical actions. |
| Research vs Engineering | [思考：研究与工程](../../../../content/posts/thoughts/思考-研究与工程-thoughts-about-research-and-engineering.md) | Name the dominant constraint, compare organizational mechanisms, and retain ownership as a shared requirement. |
| Over-communication | [思考：过度沟通](../../../../content/posts/thoughts/思考-过度沟通-over-communication.md) | Connect specific human limitations to concrete practices such as pre-reading time, checklists, and documentation ownership. |
| Huwcha Accelerator Architecture | [Huwcha Accelerator architecture](../../../../content/posts/architecture/huwcha-accelerator-architecture.md) | Dense hierarchical architecture notes, quantitative details, inline skepticism, and unanswered questions. |
| Software Is King, Especially in AI | [Software is King, Especially in AI](../../../../content/posts/thoughts/software-is-king-especially-in-ai.md) | State a strong personal thesis, explain system-level tradeoffs, and derive a personal engineering judgment. |
| Reviewed Chinese article | [端侧 coding agent 变得可用](../../../../content/posts/machine-learning/dflash2-qwen3-27b-opencode.zh-cn.md) | Direct titles, concrete workflow actions, cohesive paragraphs, and a bounded judgment about similar tasks. |

English public versions use `https://jimwang99.github.io/posts/<topic>/<slug>/`; Chinese translations use `/zh-cn/posts/<topic>/<slug>/`. Hugo removes the `.en` and `.zh-cn` language suffixes from URLs. The repository preserves the title spelling “Huwcha”; the cited architecture manual is Hwacha. Do not silently rename historical paths.

## Calibration from Jim's reviewed Chinese article

Use the [reviewed article](../../../../content/posts/machine-learning/dflash2-qwen3-27b-opencode.zh-cn.md) to interpret these choices. Learn the writing decisions rather than copying its topic, measurements, or incidental spacing.

- **State the point in the title.** Jim shortened the title to “端侧 coding agent 变得可用”. Prefer a concise subject and judgment when supported; a case-study subtitle or question is optional.
- **Preserve the author's judgment scope.** Jim changed “对这个任务” to “对类似任务” and bounded the conclusion to programming tasks similar in scale to MNIST training. Keep that extension as his engineering judgment, alongside the open question about larger tasks. Measured observations retain their actual scope.
- **Name the work.** His additions include search, debugging, and comments in the code-quality assessment. Preserve concrete actions supplied by Jim instead of reducing them to a generic claim that the workflow succeeded.
- **Explain component roles.** “使用 DFlash2 做 speculative decoding” describes a tool's relationship to a method. Preserve such relationships instead of presenting an implementation and its method as independent changes.
- **Keep a complete thought together.** Jim joined the earlier and current setups in a comparison paragraph, and connected tool use, completion, and manual inspection in a fuller paragraph. Break paragraphs when the reasoning changes; sentence count is not the criterion.
- **Use English terms with selective help.** “Context (上下文)” adds a brief gloss while retaining terms such as agent, debug, and tool-calling schema. Choose a gloss when it helps this audience; avoid translating every technical term.
- **Make caveats causal and concrete.** “前一次运行因为过热退出导致没有完成，因此也不能直接用整个任务的耗时计算加速比” explains why the comparison is limited. Preserve the reason with the limitation.
- **Keep source handling useful to the reader.** Jim removed repeated footnotes pointing to an earlier draft of the same article. Retain genuine evidence and required citations, and keep editorial provenance outside the prose. This edit is not a general instruction to remove citations.

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

## Bilingual blog and TL;DR

English and Chinese are full blog translations with no fixed length limit. Preserve the same technical account, including useful derivations, examples, measurements, and limitations. Chinese wording should read naturally and retain Jim's paragraph structure and judgment scope. The English TL;DR summarizes the main idea and strongest evidence while retaining material caveats; it adds no new claims. The default deliverable is the bilingual article, with the summary inside EN.
