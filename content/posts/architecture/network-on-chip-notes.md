---
title: "Network-on-Chip Notes"
date: 2018-12-01
aliases:
  - "/blog/arch/2018-12-01-network-on-chip/"
---

## NoC

* Clustering coefficient: the most intuitive explanation is the number of hops between two random nodes in the network.
* Layers
  + Physical layer
  + Link layer
    - Transaction protocol: such as AXI
    - Seperated channels like AXI, to avoid dead-lock caused by depency problem
  + Transport layer
    - Packet: header & payload
* Flow control
  + On link-level or end-to-end level
    - Link-level: every hop there is a notification, just like valid-ready protocol
    - End-to-end level: every transaction of data from sender to receiver has to have some kind of notification that the receiver notify the sender it has received the data successfully.
* Advantages:
  + Multiple transactions can complete in parallel in the network to utilize the routing resource.
  + Layered structure makes it more clear, and each layer can be implemented independently.
