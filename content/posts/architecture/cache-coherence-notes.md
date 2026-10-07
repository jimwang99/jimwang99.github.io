---
title: "Cache Coherence Notes"
date: 2018-11-01
aliases:
  - "/blog/arch/2018-11-01-cache-coherence/"
  - "/blog/architecture/2018-11-01-cache-coherence/"
---

## Coherence mechanism

### Snooping

Every cache maintain its own cache state. And when it needs to access a shared address space, it sends snooping messages to all the other caches to either update or invalidate them.

* Write invalidate: write operation will invalidate all the other shared copies. Others will have to read again from the next level of cache to use it again.
* Write update: write operation will give the written data to the shared copies and update them accordingly.

One could add a snooping filter to filter out the exesive snooping traffic that doesn’t belong to current cache.

### Directory-based

There is a centralized (no physically but logically) directory that maintains all the cache sharing info. All the requests have to go to this directory to ask for permission. The protocol can also be write-invalidation or write-update.

## Coherence protocol

On top of basic write-invalidate and write-update, each cache block should has its own status, which also determines the protocol. Basic MSI (modified/shared/invalid), or MESI (add exclusive) different choices.

## Software cache coherence vs. hardware cache coherence

Software cache coherence use special instructions to flush/invalidate cache entries to maintain coherence between different cores. Hardware use snooping or directory to maintain coherence. Modern SoC system uses both of them to reach a hybrid cache coherence system.

* Software coherency is hard to program and debug.

## Interesting articles

### [Extended System Coherency](https://community.arm.com/processors/b/blog/posts/extended-system-coherency---part-1---cache-coherency-fundamentals)

* 3 mechanisms to maintain coherency
  + Disable cache for shared data/address space
  + Software managed coherency
    - Clean or flush dirty data, and invalidate old data
    - Challenges
      * Software complexity: hard to debug, cache learning and invalidation must be done at the right time, and coordinates between multiple masters
      * Performance and power: how to work out which data needs to be maintained? And if it has more dirty data, software coherency takes longer to clearn and invalidate than hardware coherency
  + Hardware managed coherency
    - Snoop
      * Snoop filter
        + Centralized, and built in the interconnect
          - Save power: just look up once instead of multiple times; the processor clusters can stay in low power sleep mode
          - Higher performance: avoid CDC in multi-clock-domain system like mobile SoC.
* DVM (Distributed Virtual Memory)

### [Exploring How Cache Coherency Accelerates Heterogeneous Compute](https://community.arm.com/processors/b/blog/posts/exploring-how-cache-coherency-accelerates-heterogeneous-compute)

* SVM (Shared Virtual Memory)
  + To avoid coping shared data between processors (ex. CPU and GPU), virtual memory pages on different processors can point to the same physical memory location.
* ACE (AXI Coherency Extensions) by ARM
  + ACP is a sub-protocol of ACE
  + [CoreLink CCI-400 Cache Coherent Interconnect](https://developer.arm.com/products/system-ip/corelink-interconnect/corelink-cache-coherent-interconnect-family/corelink-cci-400)
    - JW: now they have CCI-500
* HSA (Heterogeneous System Architecture)
  + Foundation by ARM
  + Open standards
