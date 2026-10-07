---
title: "My experience with custom digital design"
date: 2014-06-06
aliases:
  - "/blog/flow/2014-06-06-my-experience-with-custom-digital-design/"
---

## Background

This is the summary of my experience from project LBRAM in Marvell in the year of 2014.

### The first thing: discuss timing/area/power SPEC’s in details

Most of the time, because custom design takes lots of time, it often starts ahead of chips. At that time, the design SPEC’s, such as timing/area/power, are not clear. So try to discuss it with your supervisor or the project leader or your customer to define these SPEC’s even if they are not accurate. And do remember to write them down in some documents, so if they want to change the SPEC’s later, you can show them how absurd the idea is. ;-)

### The second thing: do floorplan carefully in as much details as you can.

The placement of blocks; pin direction; power straps; power switch connections; routing of important signals; some local detail routing.

### Don’t touch base layers in 28nm.

I have been doing layout design since forever. I remembered to draw layout for IBM 180nm, TSMC 90nm, SMIC 130nm, Chartered 130nm, IBM 130nm, SMIC 90nm, TSMC 90nm, STM 90nm, TSMC 100nm. Now it’s TSMC 28nm. The rules for base layers are far more complicated that metal layers, especially for 28nm. So if you don’t want to keep your hands clean and don’t want to waste a whole lot of your time with DRC, don’t touch base layers. Please leave it to the specialists.

### Use scripts other than manual work.

Laker support TCL scripts. Although it’s not as powerful as ICC, it also can do lots of work. Such as place and route of cells/blocks/signals in pattern; import CDL; dump GDS; add/remove filler and lots of other work that may be repeatedly in the design iterations.

### Use demo designs to test timing of critical paths.

Before you can finish the whole design, it’s very hard to predict the timing of critical paths, because we are using semi-custom design approach. According to 80/20 law, lots of detail works lie in some less important/critical paths. So after you designed/implemented the critical path, try to design some demo top, and test it with SPICE. This wil give you more confidence in later stages.

Not like ASIC design, custom design always involves lots of manual work and it costs a plenty of time. So the TAT is huge. And there is no reasonable accurate tools to predict the timing. So use demo to run some timing test is essential to achieve timing closure in time.
