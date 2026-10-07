---
title: "ARM AMBA Protocl"
date: 2019-03-25
aliases:
  - "/blog/arch/2019-03-26-amba-protocol/"
---

AMBA (ARM Advanced Microcontroller Bus Architecture)

## 1. AXI

* AXI protocol is a **point-to-point** protocol
  + So no matter what the network channels really use, as long as its ports comply AXI protocol, IP can be connected to them
* Main features
  + Separate read/write channels
    - Improve bandwidth
  + Multiple outstanding requests
  + No strict timing relationship between address and data phases
  + Unaligned data transfer
  + Out-of-order transaction completion
  + Implicitly incremental address for burst transfer
* Transfer vs transaction
  + Transfer is a handshake: valid/ready
  + Transaction is composed of multiple transfers
    - Active transaction: already started but not finished.
* Detail signals
  + `AxBURST [1:0]`
    - `00` = FIXED (same address) = for FIFOs
    - `01` = INCR = for block transfer
    - `10` = WRAP = suitable for cache line, critical word first
      * Must be aligned
    - `11` = reserved
  + `AxPROT [2:0]` defines 3 levels of access protection privileges
    - Bit 0: Privileged or not
    - Bit 1: Secure or not
    - Bit 2 : instruction or not (hint only)
  + `AxCACHE [3:0]`
    - Bit 0: bufferable or not
    - Bit 1: modifiable or not
      * Merge-able or split-able
    - Bit 2: read allocate (hint only)
    - Bit 3: write allocate (hint only)
      * If both RA and WA are disabled, then can skip cache and directly pass to the memory controller for access
  + `xRESP [1:0]`
    - For read, each transfer of the burst has a `RRESP`
    - For write, at completion of the burst `BRESP` is issued
    - `00` = normal access success = excluesive access failed
  + `WSTRB [n-1:0]`: byte valid
  + `AxLOCK` for atomic access
    - Lock access is removed from AXI3 to AXI4
    - In AXI4 only exclusive is supported for better network fabric performance, to enable the implementation of semaphore type operations without requiring the bus to remain locked
  + `AxQOS [3:0]` defines the priority of a transaction, larger number means higher priority
    - Priority is guaranteed by arbiters
  + `AxREGION [3:0]` for a single physical slave that provides multiple logical interfaces in different address region of the whole memory space
  + `AxUSER` implemenation defined width, optional. So can be imcompatible
  + Dependency
    - `WVALID` can assert before `AWVALID`
    - `WLAST` must complete before `BVALID`
    - `RVALID` cannot be asserted until `ARADDR` has been transferred
* Atomic access
  + AXI3 has “locked access” which blocks all other masters to locked slave, while AXI4 impoved it to “exclusive access” which only blocks access to particular region.
  + Locked transaction
    - Ensure no outstanding transaction
    - Initial lock transfer, complete with an unlocked transfer
    - Performance impact is huge
    - Lock access is enforced by network fabric
  + Exclusive access
    - Semaphore style READ & WRITE
    - Requires slave hardware support
      * “Exclusive access monitor” to save exclusive operation source ID and target memory address when exclusive READ access happens, remove entry when exclusive WRITE access happens
    - `xRESP`
      * `EXOKAY` means successful, but `OKAY` means exclusive fail
      * When exclusive write reply with OKAY, the memory won’t get updated
* Ordering
  + Write
    - `W` channel must follow the same order of `AW` channel
    - Different transaction IDs on `W` can be interleaved, but same ID must in order even for different transactions
  + Read
    - No ordering between `R` and `AR`
    - Different transaction IDs on `R` can be interleaved, but same ID must in order
  + Read and write don’t have ordering between each other
* Alignment
  + Unaligned start address only affects the first transfer in a transaction, all following transfer is aligned to `AxSIZE` to relax requirement on slave side
* Interface attributes
  + Write
    - Issuing capability: a master can issue how many outstanding transactions
    - Interleave depth: a slave can receive how many outstanding trasactions
  + Read
    - Issuing capability: how many transactions a master can issue
    - Acceptance capability: how many transactions a slave can accept
    - Reordering depth: how many transactions a slave can transmit data
