---
title: "How to Evaluate NoC (Network-on-Chip)?"
---

Modern SoCs heavily relies on NoC to connect interfaces and storage to compute. As the ML models grow larger and larger, the data delivery ability becomes more and more important to overall system performance.

While everyone is talking about computing resource such as systolic array and vector processors, NoC's critical role sometimes is overseen. In this blog, I'm going to talk about the metrics to evaluate NoC in engineering practice.

Before we start we shall define the following common ground of terminologies:
- NoC layer names corresponding to OSI definition

![osi-noc-layers](/legacy-media/osi-noc-layers.png)

# Latency

The most easy to understand metric is latency, which measures the period of time a data packet travels from source to destination. It's measured by micro-seconds (us).

# Throughput

Measured by bytes per second (Bps), throughput evaluates the capability of data delivery of NoC. It's an important metric especially for large data transfer.

# Energy efficiency

Measured by pica-joules per byte (pJ/B), energy efficiency indicates how much energy is required to transfer data from source to destination. It's extreme important for battery powered devices, like mobile phones, but also important for power attached devices because of heat dissipation.

# QoS (quality of service)

Among all the traffics in the network, not all sources and destinations are created equally. Some sources and tasks shall have higher priority, for example CPU instruction fetches, because they are more important to the system performance or security. To guarantee QoS, software and hardware need to be co-designed to improve overall performance.

# Scalability

As more sources become active or more data are transferred, the NoC becomes more congestive. Scalability metric measures the decay of latency and throughput when congestion happens.

# Fault-tolerance

Complicated NoC topology and use-cases can lead to live-lock or dead-lock. Dead-lock must be eliminated at design stage, but live-lock could happen when certain extreme situation occurs. Some other situation like FIFO overflow can also cause faults. NoC design must be fault-tolerant in these situations.

# Security

Modern SoCs handles different tasks on the same chip to get better integration and cost efficiency. But it also means high-secure data are transferred along with non-secure data in the same NoC sometimes. NoC shall be able to support this kind of mixture of secure and non-secure data, while allow sources and destinations to carry out security enforcement mechanisms.

ARM's TrustZone is a good example. NoC needs to support separated secure and non-secure channels, and be able to carry user ID or role ID which defines the role of each source and destination.
