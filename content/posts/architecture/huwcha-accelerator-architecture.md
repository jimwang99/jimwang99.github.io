---
title: "Huwcha Accelerator architecture"
date: 2019-01-03
aliases:
  - "/blog/arch/2019-01-03-hwacha-accelerator/"
  - "/blog/architecture/2019-01-03-hwacha-accelerator/"
---

From the reading of this paper, “The Hwacha Microarchitecture Manual, Version 3.8.1”, I found out that our Pygmy ES1 architecture is almost the same idea, just not as fancy.

* We don’t have cache coherency, because we operate on unified physical memory space
* The vector execution unit is not as fancy, just useless multithreading, no systolic
* The prefetch is supposed to be done by DMA engine that is manually controlled by software

## System architecture

* The vector accelerator only has L1 I$, no D$
  + Don’t need to maintain cache coherency
  + Lots of vector registers, 512 in total, each is 64x2x4=512-bit
  + Wide bus connection to L2$, to provide higher bandwidth
* Uncached TileLink between L1 I$ (both scalar processor and vector processors) and L2$
* Cached TileLink between L1 D$ (only in scalar processor)
  + L2$ maintains directory bits, which determines the states of corresponding cache line (JW: maybe something like MESI bits)
* Operations of L2$, supported by TileLink protocol (“Productive Design of Extensible On-Chip Memory Hierarchies”)
  + Sub-cache-block accesses
  + Data prefetch requests
    - Read from DDR, don’t need to send back to the requester
  + Atomic memory operations
    - ALU inside L2 cache banks

## Decoupling

* Access/execute decoupling
* Decoupled vector arch
* Cache refill/access decoupling

## Vector Command Queue (VCMDQ)

* Instruction fetch is handled by scalar processor, and then sent to VCMDQ
  + There is explicity defined start `vf` and stop `vstop` instructions that flags the begin and end of vector instructions
    - JW: why is that necessary?

## Vector Execution Unit (VXU)

* In a **systolic** style
  + 4 banks in total, each bank has 256-entry 2x64-bit vector register file, as well as ALUs
  + from the block diagram, these ALUs are only add/subtration/shift operations. Multi-cycle integer multiplier/divider, and floating point operations are outside of each bank and shared by all 4 banks via a crossbar.
    - JW: I don’t think this is good for ML applications. They are trying to make it more generic, so to improve on this, we could take the same micro-architecture but simplify it as well as putting more ML (basically MAC) into it.
  + As operation flows through the banks, natually chain different operations together.
    - JW: the chaining is useful because we have limited shared function unit, such as IMUL/IDIV. For function units that are exclusive to bank, I don’t see the benifit.
* Predicate is used for simple branch and etc.

## Vector Memory Unit (VMU)

* It’s based TileLink protocol
* Vector Load Unit (VLU)
  + Opportunistic writeback mechanism: return as soon as the data is back, no re-order buffer.
  + Simultaneously manage multiple operations to avoid artificial throttling of successive loads: too many requests will drive performance down
* Vector Store Unit (VSU)
  + Vector Store Data Queue (VSDQ)

## Vector Runahead Unit (VRU)

* This block process all the vector load/store instructions in the prefetch queue from the scalar processor, generate address and send prefetch requests to L2$.
  + Prefetch request doesn’t return data to requester.
  + In ideal world, it will hide the memory access latency.
* When from a cold start, it skips the first few load/store to run ahead of the VMU, until it reaches too far ahead, determined by the number of load/store operations that hasn’t been processed by VMU yet, it pauses.
  + Cannot run too close, otherwise the memory access latency cannot be hide.
  + Cannot run too further ahead, otherwise newly loaded data will force evict the data that’s been currently using by the VXU and cause even worse performance panity.
* Also to limit using too much of the L2$ bandwidth, prefetch in L2$ only uses up 1/3 of available outstanding access (JW: I think it more likely the MSHR entries which handles any cache miss).

## Multilane

* Hwacha support paramerized number of identical lanes, and these lanes work entirely decoupled from one another.
* If the memory needed by each lane aligns to the cache line size, it will be the best, otherwise, there will be some waste of bandwidth to load unnecessary data to the lane.
* JW: curious, how do they manage multilane?
  + There is a **master sequencer** who knows the number of lanes out there as well as the vector length. It will dispatch the job to these lanes evenly.
* JW: as it discussed in the paper, the lanes work on strip size, which is a unit-stride fasion. If there is any non-unit stride, not only it will waste the bandwidth, but also it will waste the computation resource. *So I think it would be a simple dispatch based on unit-stride, the master sequencer will have to consider the stride as well.*
