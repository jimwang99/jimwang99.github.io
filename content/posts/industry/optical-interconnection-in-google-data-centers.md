---
title: "Optical Interconnection in Google Data Centers"
date: 2015-08-11
aliases:
  - "/blog/industry/2015-08-11-optical-interconnect-in-google-data-center/"
---

今天的Meetup主要讲的是Google的Data Center中optical interconnection的应用。

Presentation之后问了一个问题：Google的Data Center里面是否HDD正在被SSD取代？回答是，并没有，因为虽然SSD在读写速度上有明显的优势，但是由于存储容量的性价比非常低，所以仅是作为缓存使用。也就是说在HDD和DRAM之间再加一层SSD来提升存取速度。看来老板Sehat的FLC其实是基于市场选择而做出的理智判断（甚至不能说是预测，因为已经成为工业现实）。而且如果enterprise如果能够迅速跟上以弥补mobile市场的萎缩，Marvell在硬盘市场应该还能继续赚取利润。

> Follow-up @ 2019-02-11: Sehat已经被挤出了公司，FLC项目也随之夭折。当时做这个项目的Marvell的同事们出去搞了一个自己的公司，拿到了Sehat的投资，正在如火如荼的做这个项目。时至今日，SSD仍然没有把HDD完全取代，但是根据Marvell最近的财务状况，HDD的市场萎缩的很厉害。
