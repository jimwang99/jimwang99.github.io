---
title: "Working with Device Tree (DOULOS)"
date: 2019-01-21
aliases:
  - "/blog/embedded/2020-03-06-working-with-device-tree-doulos/"
---

## Intro

* Device tree: for non-discoverable hardware, included in BSP
* Source type
  + Old style: C code BSP, files compiled into the kernel
  + New style: device-tree BSP -> device tree blob (load by boot loader)

## Compilation

In-tree vs. out-of-tree

`dtc` command

* convert .dts to .dtb, and backwards

## Device tree syntax

* devicetree.org
* Nodes
* Properties

  + Values
* Root node = `/`
* Values format

  + int, string, list of string, phandle (reference to other node)
* Standard properties

  + `compatible`
  + `model = "vendor,board"`
  + `status = "okay"`
  + For `root` node, memory map address must be specified
    - `#address-cells = <1>`
      * define the address length
      * 1 = 32-bit, 2 = 64-bit
    - `#size-cells = <1>`
      * define the size length
      * 1 = 32-bit, 2 = 64-bit
    - `reg = <${base},${size}`
      * address map
  + Mapping between device and CPU
* Must have `cpus` and `memory@0` as nodes as well
* Special node

  + `chosen`
  + `aliases`
    - Alias to a full path of a device
* Interrupts

  + `interrupt-controller` empty property
  + `#interrupt-cells`: # of intps
  + Devices connect to the interrupt controller

    - `interrupt-parent`
    - `interrupts`
    - `interrupt-names` (optional)

## Parsing the device tree

* `device_driver` defines `compatible`
* **Unified device proerty interface**

## Device tree overlays

## Other description language

* Kernel v5.0 support YAML as well
