---
title: "Status of current HDL generator"
date: 2020-06-15
aliases:
  - "/blog/tool/2020-06-15-generator-status/"
---

Recently, I’m trying out different HDL generator languages and tools, because

1. Chisel is used heavily inside SiFive, and they have developed amount of IPs including very complicated CPUs, and a very well maintained community (mainly students from Berkeley)
2. Many other IP companies are using their type of HDL generator to generate RTL
   1. Such as ARM and Cadence. ARM’s CPU is delivered as a very well parameterized Verilog file along with a set of scripts that can take your configuration file can generate RTL/testbench/IPXACT/… accordingly in less than a minute.
3. HDL generator is pushed inside our team in FB, and believed to be the future of hardware design because of boost of productivity

The productivity boost of generator is coming from

* It’s more efficient way to describe hardware
  + Maybe not true for some of the tools and languages
* The design is more flexible in parameterization, and can be used to satisfy different requirements from customers, either external or internal
* The generator can generate all kinds of collaterals, not only RTL
  + The collaterals include address map header files for verification and software development, testbench, IPXACT for IP delivery
* Quicker turn-around-time if any feature requirement changes
  + E.g. if we need to add an extra APB port to the NoC to support a secondary UART device, normal design will at least take couple of days to revise the RTL/testbench, and another couple days to debug and run regression. But with generator, generating takes 1 mins, running regression will take another couple of hours.
  + However this advantage of generator does not come free, because you need to design for APB interface in the first place, and tried it with different configurations to make sure adding a APB port is always working fine.

## Comparison of current generator tools

| Language | Tool | Pros | Cons |
| --- | --- | --- | --- |
| Chisel (based on Scala) | FIRRTL | - Used by SiFive and already have successful projects- Google is also supporting Chisel | - Using scala with weird extension, and its syntax is far different from SV/HDL or C. So hard to learn- Alleged to be not friendly with Verification- Generating netlist-like RTL with very minimum readibility |
| Magma (based on Python) | FIRRTL | - Based on Python and can use fancy Python supported features- Support by Facebook | - Still evolving and under development, so it’s missing lots of features- The documentation is really really bad |
| MyHDL (based on Python) | Itself | - Based on Python, so easy to learn- Very close to SV | - Use AST analysis to compile into Verilog, which means any Python syntax that’s not supported will be not able to convert into Verilog. \*\*So it’s pretty much writing Verilog RTL in Python \*\*, even without SystemVerilog support. |
| … |  |  |  |

Maybe there are a lot of others, but I’ve only tried the above 3, which are the most popular ones available in public domain.

Another idea is to use Jinja2 type of template language mixing with SystemVerilog to improve the parameterization support of the latter.
