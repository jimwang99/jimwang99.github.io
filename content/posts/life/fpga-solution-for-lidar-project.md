---
title: "FPGA Solution for LiDAR Project"
date: 2018-10-23
aliases:
  - "/blog/life/2018-10-23-fpga-solution-for-lidar-project/"
---

* 1-stop solution: Zynq UltraScale+ RFSoC ZCU111 Evaluation Kit (<https://www.xilinx.com/products/boards-and-kits/zcu111.html>)

  + Features:
    - XCZU28DR-2FFVG1517E: high-end RFSoC
    - 12-bit 4GSPS ADC x8, 14-bit 6.5GSPS DAC x8 (all RFSoC has the same type of ADC/DAC, no higher speed ones)
  + Pros: 1-stop with everything we need for bench-top demo
  + Cons: expensive $9K, need secondary solution for backup; overkill for second step product
* FMC daughter board with high-speed ADC

  + FMC163 (<https://www.abaco.com/products/fmc163-fpga-mezzanine-card>)
    - 1x 12-bit ADC, 4.0 GSPS at single channel, or 2GSPS at dual channel, LVDS (TI’s ADC12D2000RF)
    - 1x 14-bit DAC, 5.7 GSPS, LVDS (ADI’s AD9129)
    - Question: will it work with our backup dev boards?
  + AD-FMCDAQ2-EBZ (<https://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/eval-ad-fmcdaq2-ebz.html>)
    - 2x 14-bit ADC, 1.0 GSPS, JESD204B (ADI’s AD9680)
    - 4x 16-bit DAC, 2.8 GSPS, JESD204B (ADI’s AD9144)
    - $1495, buy directly from ADI
  + EVAL-FMCDAQ3-EBZ (<https://www.analog.com/en/design-center/evaluation-hardware-and-software/evaluation-boards-kits/eval-fmcdaq3-ebz.html>)
    - 2x 14-bit ADC, 1.25 GSPS, JESD204B (ADI’s AD9680)
      * Question: why the same device, here is 1.25G but it’s 1.0G previously
    - 2x 16-bit DAC, 2.5 GSPS, JESD204B (ADI’s AD9152)
    - $1495, buy directly from ADI
      * ADI provides the whole package, including RTL for FPGA, dev board schematic and etc.
  + ADC12D1800RF Reference board (<http://www.ti.com/tool/ADC12D1800RFRB?keyMatch=adc12d1800rfrb>)
    - 12-bit, dual 1.8 GSPS or single 3.6 GSPS, LVDS (TI’s ADC12D1800RF)
    - $2999, buy directly from TI
    - It has a Xilinx Virtex-? on board, but I doubt it can be programmed
