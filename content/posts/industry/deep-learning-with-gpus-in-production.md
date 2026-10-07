---
title: "Deep learning with GPUs in production"
date: 2017-03-21
aliases:
  - "/blog/industry/2017-03-21-deep-learning-with-gpu-in-production/"
  - "/blog/machine-learning/2017-03-21-deep-learning-with-gpu-in-production/"
  - "/blog/ml/2017-03-21-deep-learning-with-gpu-in-production/"
---

Start-up: python -> enterprise: C/Java/Scala, more engineers, faster
Research: quick result and prototyping

GPU? Data movement between GPU and CPU is important

[ ] fast.ai: class (high school math)

infrastructure: spark/flink
scheduler problem
distributed file system

Problems to think about when running works on GPU clusters
memory is relatively small
throughput, jobs are more than matrix math
resource provisioning: how many resource we need? GPU/CPU/RAM
GPU allocation per job
Python <-> Java overhead, defeats the points of GPUs

-> lots of problems that is not well considered nowadays

FPGA? No customers are using FPGA acceleration nowadays, since most of them don’t even know GPUs yet. Their requirements are keep the data private (not on to cloud), and they basically use Intel CPUs to run deep learning applications. And FPGA is very hard to use, because of Verilog. So Skymind don’t have plans to support FPGA yet, even given Amazon has FPGA service.
