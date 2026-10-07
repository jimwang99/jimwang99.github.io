---
title: "Note of RISC-V Vector ISA Spec v0.6"
date: 2018-12-15
aliases:
  - "/blog/arch/2018-12-15-riscv-v-spec/"
  - "/blog/architecture/2018-12-15-riscv-v-spec/"
  - "/blog/riscv/2018-12-15-riscv-v-spec/"
---

## Vector regfile

* 32 of them, v0 to v31
* Each is `VLEN` bits
* Each can be divided into several elements
  + The max element width is `ELEN`
  + CSR `vsew` maps to `SEW` (standard element width) controls their width dynamically
  + CSR `vl` controls the number of elements to operate on for vector instructions
* Packing of shorter vector
  + when `SEW` is smaller than `ELEN`, multiple SEW will be packed into one `ELEN` unit
    - Following little-endian rule
  + `ELEN` units are packed into `VLEN` register also
    - Following little-endiam rule
* Storage of longer vector
  + If operand longer than `SEW` is needed, then
    - Even-numbered vector register holds the even-numbered elements
    - Odd-numbered vector register holds the odd-numberred elements
    - **WHY?** the author said it’s designed to simplify data path alignment
* Register grouping via `vlmul` field
  + Any operation applies on one vector register `n` will apply on all the other vector registers in the same group
  + Depending on the `vlmul`, 00 = no group, 01 = v[n+16], 02 = v[n+8], 03 = v[n+4]
    - `VLMAX` will change accordingly, by double, quarod, 8 times
* Reuse for floating-point regfile
  + Floating-point registers reside at the LSB `FLEN` of the vector registers
  + Lower precision floating-point types are NaN-boxed (MSB bits are set to `'b1`)
  + Loading floating-point data doesn’t change the upper bits where `VLEN` > `FLEN`

## Vector operation

* Masking
  + Masked off elements are skipped, and will not generate exceptions
  + Use the LSB of each SEW in `v0` as the masking bit
  + 4 types in `vm[1:0]`: true, false, scalar, no-masking
* Vector load/store
  + Unit-stride
    - Starting address = base address in RS1 + imm offset
    - Fault-first version
      * **WHY?**
  + Constant-stride
    - Base in RS1, stride in RS2, by an unit of byte
  + Indexed (scatter-gather)
    - Base in RS1, indices in VRS2 (signed integers)
      * If `SEW` is larger than `XLEN`, LSB bits are taken
    - For store, there is an extra *unordered-indexed load*, in contrast to *ordered-indexed load*
      * JW: we can make *unordered* version to be higher performance
* Vector arithmetic
  + Widening operation with `w` suffix puts 2xSEW wide destination into an even-odd vector register pair
  + Merge: use the mask field to merge 2 source operands
  + Narrowing: convert multi-width vector into single-width vector
  + Reduction: scalar <= vector op scalar
  + Matrix multiplication support
    - Fused-multiply-add + reduction
  + Mask
    - Mask population count
    - Find-first-set mask bit
    - `viota`: count the number of elements in `v0` that’s masked or un-masked
      * Can be combined with scatter/gather instructions to perform vector compress/expand instructions
      * They are still discussing if this should be able to take any registers, not only `v0`
    - Set-before-frst mask bit
  + Permutation
    - insert/extract
    - slide
    - gather

## Exception

* CSR `progress` logs the element index that caused the trap
  + With this, failed operations can resume from where exactly it traps exception
* Precise vs imprecise traps
  + Precise trap: slow, but support debug
  + Imprecise trap: fast, but possibly obscure error conditions
  + Implementations can choose
