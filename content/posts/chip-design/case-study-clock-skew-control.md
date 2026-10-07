---
title: "Case Study Clock Skew Control"
date: 2017-04-18
aliases:
  - "/blog/flow/2017-04-18-case-study-clock-skew-control/"
---

Question: how to control the clock skew between a group of clocks to be minimum, say less than 30ps, instead of utilizing useful skew? This case happens to our hard macros.

A: in Innovus, use skew group

```
set min_skew_group {
    path/to/clock/NLVB_CKB
    path/to/clock/NLVA_CKB
    path/to/clock/NLVP_CKB
}

create_ccopt_skew_group \
    -name                       min_skew_group \
    -sources                    path/to/clock/source/CKB \
    -sinks                      $min_skew_group \
    -target_insertion_delay     0.500 \
    -rank                       1
    -target_skew                0.000

set_ccopt_property constraints -skew_group min_skew_group ccopt
```
