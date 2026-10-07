---
title: "CPU Architecture Notes"
date: 2018-11-01
aliases:
  - "/blog/arch/2018-11-01-cpu-architecture-notes/"
  - "/blog/architecture/2018-11-01-cpu-architecture-notes/"
---

## Register renaming

To eliminate the **false and output data dependency** by adding extra physical registers more than architectural registers.

* Read-after-write (RAW) is **true data dependency**
* Write-after-write (WAW) is **output data dependency**
* Write-after-read (WAR) is **false data dependency**

## Superscalar

Dynamically issue multiple instructions in each cycle to increase IPC.

* Normally need multi-port register files and ALU to avoid structural hazard.
* Can be in-order or out-of-order

## Re-order buffer

For out-of-order execution CPU architecture, results are put into re-order buffer waiting for commit. These result can be forwarded to later instructions.

Content of a typical re-order buffer entry

* valid
* result
* instruction type (jump, store to memory, store to register)
  + ? Why?
* destination (memory address, register address)

## SMT (Simultaneous Multi-threading)

Opposed to **temporal multi-threading**, which is interleaving multi-threads in one single core, **simultaneous multi-threading** issues multi-instrunction from different threads in one cycle. So it has to be supr scalar.

* Multiple PC and large register file
* Research indicates that it’s power efficient even when there is no performance boost

## SPMD (Single program multi-data)

Tasks are split up and run simultaneously on multiple processors with different input data. It’s the most common style of parallel programming.
