---
title: "Ariane (PULP series high-performance core)"
date: 2018-12-01
aliases:
  - "/blog/arch/2018-12-01-ariane-cpu/"
  - "/blog/architecture/2018-12-01-ariane-cpu/"
---

[Ariane Document](https://pulp-platform.github.io/ariane/docs/home/)

![Ariane Block Diagram](/legacy-media/ariane_overview.png)

## Architecture note

### PC gen stage

* The fetching address for i-cache is always word-aligned.

### Fetch stage

* Its fetch stage doesn’t have much decoding work to do, only the necessary one to generate next PC. And it relies on its branch prediction to give out next PC.
* There is an internal FIFO with 2 entries to log the PC (and other meta-info) that was sent to i-cache, while waiting for its response.

  + JW: This method can decouple the delay of i-cache.
* There is a sync FIFO on the output boundary of fetch stage to decouple front-end and back-end.

  + JW: the scheduler pop from this FIFO when there is available resource for the next instruction. And potentially it can be easily changed to dual-issue by changing the read mechanism of this FIFO.

### Decode stage

* It puts the RVC decoding in the decode stage.
  + JW: this is better than what we had in ORV, in which I put the RVC decoding and realignment in IF stage, and made the critical path more critical than ever. That’s a bad decision to be honest. I was given too little time to think about this timing problem when I was adding RVC support.
* The decoded info from this stage is very limited. It always seems like this stage is for RVC decoding only.
  + JW: It could be potentially merged with issue stage. I don’t quite understand their design consideration here.

### Issue stage

* It waits for branches to be solved then issue predicted instructions into execution. It’s definitely OK because all the branch instructions in RISC-V only needs 1-cycle to resolve in ALU, so it won’t be any kind of performance loss.

### Execution stage

* Load operations are issued/executed right away because there is no side effect. Need to check the store buffer first in order to get the most updated data.
* Store operations are put into store buffer first, after going through MMU, to wait for commit. Multi-issue architecture makes store operations can be killed, therefore it cannot be write into D-Cache when issued.
  + Speculative buffer: used to store the non-committed instructions that could be potentially killed later
  + Commit buffer: move the entry from speculative buffer into commit buffer as soon as it’s committed at the commit stage
  + Both buffers are working on physical address
* CSR buffer: in this multi-issue architecture, CSR operations could also be killed by its previous exceptions. So it has to go into a buffer/queue. And also this buffer off-load some info from the main scoreboard.

### Commit stage

* Golden rule: no other pipeline stage is allowed to update the architecture state under any circumstances.
  + The architecture states includes register file, CSR, memory (D-Cache in this case)
* This stage also handles exceptions and interrupts, as well as stall
  + JW: ORV uses the same stall strategy, propagating stall backwards from commit stage. After squeeze out all the bubbles, the pipeline will eventually stop.

## Plans

After reading through the architecture documents, I’m more and more curious about its implementation. I’ll have to say that it really makes me rethink about my own design a lot. So my plan is to read through the whole project to learn from them.

Several good points of their project

* Support Verilator
* Use Travis CI
