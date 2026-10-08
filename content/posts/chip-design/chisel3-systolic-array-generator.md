---
title: "Chisel3 Systolic Array Generator"
date: 2024-02-20
aliases:
  - "/posts/projects/chisel3-systolic-array-generator/"
---

#hardware #accelerator #chisel #open-source

I've tried to learn Chisel 5 years ago, but gave up and went back to SystemVerilog to design our RISC-V CPU + AI custom instructions from scratch. After 5 years, both Chisel and myself grow a lot, so I'm giving it another shot. This time, I found Chisel3's documentation and tutorial is way better than 5 years ago. With numerous answers on Stack Overflow, LLVM's CIRCT, Chisel simulator Treadle, and unit-test framework ChiselTest, it's much easier to write and test Chisel/Scala.

Here is my first mini-project to write a systolic array in Chisel and test it with ChiseTest.

https://github.com/jimwang99/systolic_array
