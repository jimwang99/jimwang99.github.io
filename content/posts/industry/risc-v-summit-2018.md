---
title: "RISC-V Summit 2018"
date: 2018-12-04
aliases:
  - "/blog/industry/2018-12-04-riscv-summit-2018/"
---

# My notes on RISC-V Summit 2018 at Santa Clara Conventional Center

This year’s summit has many more participants than the last one, which means RISC-V is getting a lot of momentum around the world. Although most of the speeches are technology-detail-less propaganda thing, we still can find something useful out of it. And more importantly, talking to the engineers manning the booth is very interesting and information rich.

## SiFive’s biz model

* Help customer to tape-out prototypes, and sell chips back to the customer.
  + Fundamentally similar to old school design house
* Front-end is a highly configurable design generator, with which customers can easily change the configuration and get the SoC RTL. Then they can drop-in their proprietary IP with TileLink interface.

## SiFive’s Freedom Revolution platform

* SiFive acquired OpenSilicon, and it gets HBM2/Interlaken/… IPs, with their own 7-series CPU core (dual issue), they now can offer full SoC solution to custmers
* Interlaken: chip-to-chip connection, 1.2Tbps, proprietary (not open source)

## Hwacha v4

* Vector register file
  + Different from new RISC-V vector ISA, it merges storage of low precision registers
* Sequencer
  + Systolic bank unit
    - Stall free, like TPU
* VRU: vector runahead unit
  + As I understand, it only prefetch the instruction, not the data. Actually the data part is more critical in prefetch
* Polymorphic extension
  + ? What?

## platformIO.org

* Cloud, unified IDE for remote debug and CI
* Free and open-source
* Goes down to OpenOCD level, if we can make the hardware drives to support OpenOCD, then it can support it.

## RENODE

* Simulator of RISC-V system
* PolarFire SoC

## David Patterson’s keynote speech

* Learn from the software side of progress
* When Moore’s law stops, people catch up
  + Apple A12 is better than Intel’s CPU in single thread performance
* Security challenge nowadays is more and more serious
* RISC-V committee: slower, but last longer
* Open ISA vs. open hardware
* TPU: software controlled memory (instead of cache)
* Serverless computing
  + Raise the level of abstraction
  + Not x86 forever

## Yunsup Lee’s keynote speech

* From customer: “we need more customization”
* EDA on cloud: Cadence + MS Azure

## Rob (NXP)‘s keynote speech

* Fragmentation is a big concern
* VEGA board + PULP
  + 2x PULP cores + 2x ARM cores
* Foundries.io
  + Software around RISC-V

## AntMicro Keynote speech

* Several things are going too slow
  + Linux-enabled cores
  + Non-CPU IP is still hard
  + Supply chain of making chips is painful
* Solution: FPGA
* LiteX: open platform for Linux and MicroSemi
