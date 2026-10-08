---
title: "ML System Architecture (1) System Level Parallelization"
date: 2024-02-01
date_estimated: true
---

To optimize the efficiency of training or executing an ML model, whether implemented locally on a device or hosted in the cloud, parallelization plays a critical role, akin to other computational challenges.

Utilizing multiple compute engines—ranging from several compute units on a single microchip to numerous GPUs within a data center—allows for the division of computational tasks and their parallel execution.

## 3 Types of parallelization

Ordered from coarse granularity to fine granularity.

### Data parallelization
- Data parallelization involves splitting the dataset across multiple engines, and run a subset of that dataset locally on each engine.
- Data parallelization usually is applied across different servers, because the latency for communication among servers are relatively too high to effectively apply model parallelization or tensor parallelizations.
- Training usually involves large amount of dataset, so it's very efficient and good practice to use data parallelization in training.
    - After each mini-batch, there is a sequential point when all the gradients are gathered so that optimizer can step and update the weights.
- For on-cloud inference, if it's a high-demand application with enough requests per second, data parallelization can be useful.
    - Don't confuse it with batching which involves gathering multiple requests and then running a single inference with all these requests in a single batch. Batching during inference improves the bandwidth, but produces worse latency.
- For on-device inference, usually there won't be enough requests or compute resources to do data parallelization.

### ~~Model parallelization~~
- Model parallelization involves splitting the model by layers and run different layers across multiple engines. And the compute engines form a pipeline with hidden state tensors flowing from one engine to the next.
- Since each engine only needs to hold a small portion of the model weights, so it's enabled training / running large models on compute engines with limited memory.
- However there is significant communication cost between compute engines, because hidden states are usually large in size.
- And because of data dependency, full system performance is determined by the slowest stage in the pipeline; and the end-to-end latency is high.
- And because of its long latency, it's a poor choice for all the scenarios from training to inference.

### Tensor parallelization
- Like model parallelization, tensor parallelization horizontally split the model's tensors and operators into tiles, and run different tiles across multiple engines.
- Among the tiles of the same tensor, there are no data dependencies, therefore as long the input tile is ready operation can start right away. This feature makes tensor parallelization popular with CNN models, because operations can be stream-lined for tiles on different engines.
- Although there are no data dependency between tiles of the same operator, there will be sequential points in the model that cannot be tiled and parallelized, for example batch normalization.
- The communication between engines is also significant, because result from layer N-1 needs to be multicasted to operations of layer N on a different engine.
- For all of the scenarios, tensor parallelization can help with acceleration.
