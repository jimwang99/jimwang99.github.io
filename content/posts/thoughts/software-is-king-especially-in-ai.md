---
title: "Software is King, Especially in AI"
---

# "Software is king"

It's a hard statement to make, as a veteran hardware engineer. Lots of pride and ego to swallow. However, it's truly based on my observations in the industry. Allow me to reason it with the following arguments:

**(1) Software has direct impact on user-experience**

It is the last layer that users interact with. And user-experience is the first and last thing will make you standout in the business world with so many competitors. Software directly decides how your users use your product.

**(2) Software has the power and the flexibility**

Well designed software can dramatically improve system performance and power consumption. It's a known fact that in a software hardware system, more benefits in performance and power you will be able to extract when you move up the system layers. The trade-off is the techniques used in optimization become more specific and tied to applications when moving up the layers.

It's also a double-edge sword. Bad designed software can harm the performance and power consumption in ways very hard to detect and debug.

**(3) Hardware engineers underestimate software's complexity**

In a hardware majority company or team, like traditional IC design houses, decision makers that come from the hardware branch of the organization unintentionally underestimate software's complexity. Therefore, either they don't allocate enough resource in software, or start to involve software engineers into the decision making process too late.

This tough reality often sends the situation downhill, and software becomes the absolute bottleneck. The throne in this situation is a hot spot.

# Especially in AI

Why do I say it's even more seriously in AI domain?

**(1) AI is evolving fast**

AI is evolving so fast. Models are improving in terms of not years or months but weeks or days. Different use-cases and business models are booming with so many startups every week.

However, hardware simply cannot catch up. The cycle to build and deploy a hardware solution is usually months. If it involves making custom silicon, then we are talking about years. Therefore the trend is moving the complexity from hardware to software.
- With most generalized hardware, fast evolving software can be changed in much faster pace.
- With "well designed" software stack, like LLVM compilers, we can move lots of optimization to compile time and fully utilize the power of hardware.

**(2) AI is complex in software, simple in hardware**

Mathematically, AI is complex in software but simple in hardware, because the atomic operation in deep-learning models is MAC (multiplication-addition-accumulation). The complexity comes from the total number of MACs we need to do. How to run them fast and with less power is the question keeps most AI engineers up in the night.

# My Answer

My answer, as a veteran hardware engineer, is to develop myself into system-level position, to understand both software and hardware
