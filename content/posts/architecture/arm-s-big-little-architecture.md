---
title: "ARM's big.LITTLE Architecture"
date: 2019-01-30
aliases:
  - "/blog/arch/2019-01-30-arm-big-little/"
---

<https://developer.arm.com/technologies/big-little>

big.LITTLE is a practical example of SMP (Symmetric Multiprocessing). It combines high performance CPU cores and low power CPU cores in the same chip, connected using cache coherent interconnect, to achieve **high peak performance within thermal bounds of the system** when intense computational power is needed, as well as **maximum energy efficiency** when the device is in light usage mode most of the time. It’s a particular adaption to mobile devices usage.

Highlights:

* The CPU subsystem, including both types of CPU and GPU, is fully cache coherent.
* Both types of CPU cores are fully architecturally identical.
  + Same instruction with same extension support, ex. virtualization, large physical addressing, and etc.
* Open source software to automatically handles the allocation of tasks
  + GTS (Global Task Scheduling)
* End-to-end suite of IDE (ARM DS-5 dev studio), as well as performance analyzer for software

![big.LITTLE System Diagram](/legacy-media/bigLITTLESystemDiagram.png)
