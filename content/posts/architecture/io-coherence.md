---
title: "IO Coherence"
date: 2020-05-18
aliases:
  - "/blog/arch/2020-05-18-io-coherence/"
---

Cache coherence between CPUs are most explained in textbooks, but IO coherence is not well understood. Recently I’m involved in architecture discussion about IO coherence, and found this paper, “Maintaining I/O Data Coherence in Embedded Multicore Systems” by Thomas B. Berg 2009, very useful coming to explain what is IO coherence and how to implement it in embedded system.

# I/O Coherence

## Producer-consumer model

Most mechanisms for passing data between IO device and CPU, either CPU -> IO or IO -> CPU, use the classic producer-cosumer model.

### What?

* Producer writes data to memory
* Producer sets a flag to notify consumer
  + Write memory or raise interrupt
* Consumer recognizes the flag
  + Pull memory or serve interrupt
* Consumer read data from memroy

### How?

* **Consistency**
  + WAW: consumer observes write of data and write of flag in correct order
* **Coherency**
  + RAW: cosumer read must get correct/latest data from producer

### Therefore

\*\*IO = consistency & coherency of data passed between IO device and CPUs

# Software IO Coherence

![img](/legacy-media/image-20200518105054003.png)

## CPU -> IO

### How?

1. CPU writes data to memory (cached)
2. [CRITICAL] CPU makes that data visible to IO device
   1. Use uncached or write-through memory type
      1. More traffic (need hardware support for write-gathering)
   2. Flush cache then fence (memory synchronization)
      1. Hard to manage between multiple CPU cores. (e.g. OS managed process may migrate from one core to another and leave residual in both L1 cache)
3. CPU sets a flag
4. IO device regonizes that flag
5. IO device reads the data from memory

## IO -> CPU

* The process is almost the same
* Because the IO device is lack of intelligence, so CPU has to guarantee that “data has arrived to memory before it reads”
  + Tricks: CPU can send a read register command to device, if device follows the PCI ordering rules, it will guarantee that read is finished after write reaches its destination.

# Hardware IO Coherence

![img](/legacy-media/image-20200518105133895.png)

As shown in the figure above, IO coherence is achieved by hardware “coherence manager” that manges accesses from both CPU and IO device. Since hardware manages the coherency, there will be software overhead.

However, if there is last-level cache, (optional L2 in the above figure), avoid polluting that cache is an issue. Large amount of IO data will crowd out existing cache lines. By marking non-shared IO data to bypass cache, we can solve this issue.

# Impovement

## Use scratchpad on-chip memory instead of DRAM

* Software managed approach
* Use high speed on-chip SRAM as scratchpad to store data will increase the bandwidth dramatically.

## Hybrid architecture

* Use IOMMU to combine software / sratchpad / hardware all together, and select different method according to different use case
  + Software overhead of managing this IOMMU can be significant
* High-bandwidth data that isn’t processed by a core could use a sideband path to memory
  + To avoid coherence manager
