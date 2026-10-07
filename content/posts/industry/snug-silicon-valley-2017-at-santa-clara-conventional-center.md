---
title: "SNUG Silicon Valley 2017 at Santa Clara Conventional Center"
date: 2017-04-30
aliases:
  - "/blog/industry/2017-04-30-snug-2017/"
---

# Day 1 Morning

1. Paper from microsoft

* Microsoft has a IC design team? Apparently it does.
* Grey code: even when metastability happends, it falls to adjecent states, instead of unknow states, it’s acceptable in some cases.
* Data bus bridge (DBB) for low data throughput
* Async FIFO: more area, more complexity

2. Panel: synthesis into the future

* The disruption in advanced nodes (10nm/7nm)
  + Thermal: drives max freq; heating wires degreeds EM lifetime
  + IoT: analog-digital co-design; physical/electical context-aware synthesis (the tool need to be aware of the block’s specific attributes, such as thermal/IR to avoid analog/digital interference. Ex: PLL cause high IR drop so it cannot be placed near some sensitive digital blocks)
  + Power: low power is usually focused, but power density is more important. Thermal dissipasion is the key to successful product.
* Context includes 2 different aspect
  + Chip-level placement and interface
  + Thermal dissipation
* Accurate variation modeling is important for the digital
* Blind clock gating for big blocks is not very good for IR drop, because it will create large power/ground noise. Instead, use smaller cores to go continuously is a better choice other than using large powerful cores working on and off.
* My take-aways: future EDA will merge front-end and back-end. The flow will be unified, as well as the interface and engines. It will require engineers to know better for the whole flow. It fits my understanding of full stack engineer.

# Day 1 Afternoon

1. Paper from Broadcom about DSP ungrouping

* Not interesting as expected.
* Issue with auto ungrouping: design hierarchy change, or even port/logic change/moving
  + constraint need to change (it seems Broadcom use hand written constraint file for synthesis and timing analysis, instead of dump out SDC from Synthesis tool to use it in STA)
  + script need to change
  + porting script from one design to another is difficult
* Potential target to choose for ungrouping?
  1. no ungroup at all vs. auto ungroup
  2. analyze both timing reports to find out critical paths that improved after ungrouping
  3. only ungroup the paths that improved
* One take-away: they dump out timing paths into text files and do post-processing using Python. Another one is from my question, they use unified constraint files for both synthesis and STA, instead of write out SDC from synthesis tool and use it in STA. That actually make sense because unified constraint files are more understandable.

2. Configurable design using SystemVerilog

* Virtual classes, parameters, interfaces and etc to make RTL design more configurable. The author did some research abour work-arounds and what is synthesizable with current DC and VCS.
* Afterwards, I had a very interesting talk with the author and some other audiences. One important thing the others mentioned is that even 99% of the tools support one feature, and if the other 1% is not will kill the whole schedule. And they were beaten up a lot by other designers or front-back-end engineers because they use advanced coding techiques from SystemVerilog in their RTL. Some guy from Qualcomm mentioned that he was forbidden to use even parameters in his block. So it seems that there are not strong willing to switch from Verilog to SystemVerilog, especially from management level because nobody want to take risks in exchange of some configurability. That actually leads to my question to them that if anybody sees any performance improvements by using SystemVerilog. The author mentioned that using “for” loops instead of multiple “assign” will help the compiler to understand design intent and somehow improved the performance in one case.

# Day 2 Morning

1. Nanotime used in NVIDIA (Robert)

* The presentation is from its memory team. The author mainly focused on the POCV features in Nanotime, and how to embedded ocv\_sigma tables in liberty file from extract\_model. And they did some correlation between POCV in Nanotime against Monte Carlo in HSPICE. The correlation is not very good at present time with the characterization script (to generate OCV parameter for each kind of transistors) provide by Synopsys. He also mentioned that they are going back to close the loop by feedback the correlation result into characterization script, hoping to improve the accruacy.
* Transistor variation coefficient (characterization script from Synopsys)
  + `set_variation_parameters`
  + for every individual types of transistors (different parameters)
  + transistor variation in stack series is **different**: more stack less variation
* How to validate the path variation?
  + Use SPICE Monte Carlo simulation after write\_spice from Nanotime.
* How to choose candidate for DDS?
  + Critical paths
* LVF tables (ocv\_sigma) have delay/transition/setup/hold

2. Nanotime flow in Wave Computing (Roger Carpenter)

* Product
  + 16K instances of DPU
  + Entire core is custom design
    - Network-on-chip, PCIe, DDR, HMC (Hybrid Memory Cube)
  + Global async local sync design
* Runtime issue? No.
* Coverage report to define the completion of constraint coverage
* Nanotime vs. write\_spice
  + TT 25c no SI: delta < 8%
* This is very interesting for myself personally because they are using custom digital design approach to implement deep learning accelerators which can achieve 10GHZ (actually what I heard is 6.7GHz in 16nm). They used schematic and hand placment, used pulse latch + domino logic + global async local sync clocking scheme. They used to use spice to close timing on their DSP core (which has 16k instances overall) in 28nm but finally moved into Nanotime. It is a very interesting company. And amazing to hear that anybody is still using this “lost art” in real chip design.
* Afterwards, we have several people gathering around to talk about this. A guy from Intel also mentioned that Intel themselves have moved away from custom design.
