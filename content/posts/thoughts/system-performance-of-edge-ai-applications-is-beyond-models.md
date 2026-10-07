---
title: "💡 System Performance of Edge AI Applications is Beyond Models"
---

After working on enabling use-cases for edge AI accelerator for more than 2 years now, here is some of my thinking about system performance.

# Thoughts: Much More Beyond Model

 One of the biggest challenges we've been facing is how to improve overall system performance. (While the other is how to quickly enable a model from CPU / GPU backend to custom AI accelerator backend.)

According to my observation, system performance of edge AI has the following attributes:
1. End users care about end-to-end performance that includes latency, power and throughput (in this particular order).
2. End-to-end performance is much more beyond just the model itself, with extra overhead from:
    1. Data loading, ie. from DRAM to on-chip memory.
    2. Data transfer, ie. from CPU to GPU over PCIe.
    3. Memory copy, ie. user space from/to kernel space.
    4. IPC (inter-process communication), ie. interrupting main CPU that runs Linux.
    5. Application specific pre/post-processing, ie. tokenization, YUV2RGB and etc.
3. AI applications are different from typical software applications because:
    1. It has a model loading phase and model size is usually very large.
    2. Once loaded, a model can be reused in later inferences.
    3. Inference may consumes / produces large data blobs, depending on use-cases.
    4. Inference is usually not the final stage. One exception is LLM (large language model).

Lots of effort has been focusing on optimizing the model itself, for performance (accuracy and etc.) and performance (latency and power). However, less focused on optimizing the overall performances as a whole system.

## Real-life example

One real-life example: in many of our use-cases over 60% to 80% of the end-to-end latency comes from software stacks above model inference, in some extreme case this number goes above 90%. As you can imagine how much time will be spent on data transfer / memory copy / IPC and post-processing when a high resolution image captured from an embedded camera has to be tiled and transferred back-and-forth over PCIe while being controlled by Android OS and post-processed by software running on GPU.

## Project management and politics

Another very important factor is more about project management and politics. An end-to-end use-case usually involves many subsystems that are created / managed by different teams and most likely under different VPs. Every one of them cares about their own subsystems and have their own priorities. The first challenge is not to come up with a technical solution, but to persuade everyone to recognize "end-to-end performance IS a top-priority problem that needs to be fixed". And every steps afterwards are projects of their own: define optimization metrics and targets; define budgets for each components; system modeling; system integration and etc. After all these, we can finally reach to the stage of system performance optimization.

## System View

To understand the overall performance of edge AI applications, it's pretty important to establish a system view. It requires you to take a step back and zoom out, to see different components of software and hardware as a system without any bias. Unfortunately this is not easy. Sometimes due to the background of one person, either from hardware or software; sometimes due to their personal favorites of different components.

It's also important to involve experts from different domains into the discussion, so that all aspects are covered and they can provide insights from different angles.

## Data-driven decision making

To mitigate all these difficulties, one of the weapon I always use is "data-drive decision making". When you have data, the decision making process can converge much faster. It's hard to find any engineers that would ignore real data either from a modeling system or a prototype, although they may challenge your methods to get those data or they may have different interpretations of the same data.

To get data, you will need:
1. A clear definition of final metrics, which usually are latency, throughput and power.
2. Either a modeling system or a prototype.
    1. A list of compromises and abstractions in these systems.
    2. A set of profiling methods built into your model or prototype.


# Practice: Profiling and Optimization

In this section, I'm going to discuss the practices of profiling and optimizing latency, throughput and power of a system.

## Latency

Latency is probably the easiest to profile among all three.

For simplicity, cycle counters can be used in software to measure latency. But you shall consider the following factors:
- Measure not only the end-to-end latency, but also every stage of your software stack.
- Reporting could be causing latency itself, especially if you use `printf` and low speed interface like UART.
    - Instead, you can save intermediate data into memory and dump them out periodically. Some debug system includes an independent MCU that can help with this kind of task.
- CPUs that software is running on can adjust their frequencies and also can go to sleep with clock stopped.
    - Most scenario, OS provides more sophisticated routines to get wall-clock time.
    - For early stage development, you can just disable DVFS (dynamic voltage frequency scaling) and auto-sleeping.
- If multiple CPUs are involved, they need to have a common agreement of time.
    - Usually a heterogenous SOC provides a low-frequency always-running system timer.
- Timer's resolution. To conserve energy, always-on timer usually runs at a frequency of mega-hertz or even kilo-hertz.
    - You should consider the following numbers: the latency of an IPC into Linux usually takes 200us to be answered; the latency of an IPC into RTOS usually takes 50us to be answered; single-lane PCIe 4.0 is maxed at 2GB/s, so it will take 600~700us to transfer 1MiB of data.

To optimize latency, you could consider:
- Optimize the algorithms
    - Other than normal optimization methods, you should look at if any processing heavy functions can be accelerated by using vector processors.
- Optimize memory copying
    - Even though we will not be able to achieve zero memory copy due to security reason or for maintaining abstraction levels, we surely can try to avoid useless memory copy as much as possible.
- Reduce IPC overhead
    - Some times due to program / functionality partitioning, IPCs are used excessively between different processes on the same CPU or between different CPUs. Optimizing for the system to combine and reduce these partitions can lead to a more efficient system.
    - However, you do need to take into consideration that in production environment if a certain processor is over-subscribed or not. Because putting too much work on one processor can dramatically reduce its overall throughput and affects each workload's latency.
- Caching
    - Some more fundamental techniques like caching can also be used to help with latency. You should consider cache to be a more general terminology other than CPU cache. For example, keep frequently used models' weights in GPU memory to avoid repetitive reloading from CPU memory.
- Parallelization
    - Run different parts of the model on different execution engine can improve latency, but will require software support for synchronization. E.g. future and await support in PyTorch.

## Throughput

Throughput is usually measured from the end user's point of view, ie. frame per second for a video conference call application.

To optimize throughput, you could consider:
- Optimize the latency
    - If the latency of each frame is small, overall throughput is improved.
- Parallelization
    - Parallelizing data transfer and model inference of different models, or the same model but different inferences. E.g. running video enhancement ML models on PCIe attached GPU, you can process frame N on GPU while transferring output of frame N-1 to CPU and transferring input of frame N+1 from CPU.
- Context switch
    - QoS (quality of service) is another important metric to measure system throughput, and it cares more about the latency of high priority tasks than low priority ones. System needs to support saving context of running low priority task, and restoring its context after high priority task is finished.

## Power

The power-related metric shall be considered from three separate angles, max current, TDP (thermal design power) and total energy.
- Max current means the maximum transition current the hardware draws, and is limited by the transition current that can be provided by PMIC (power management IC) and power supply mechanism. Higher the max current is required, more expensive PMIC you will need.
- TDP is the average power the hardware consumes over a relatively long period of time, e.g. seconds to minutes, and is limited by the cooling mechanism and overall industry design. Higher TDP, better heat sink and cooling design you will need.
- Total energy is the energy needed to complete the task, no matter how long it takes, and is limited by the battery the device has. Higher total energy, larger battery you will need.

For edge devices, if it's powered by battery, all three factors are important and needed to be considered.

To optimize **power**, the most effective weapon is to lower the voltage. That's one of the strongest arguments to push the envelop of the semiconductor process from 28nm to 5nm. Even with the same semiconductor process, choosing lower nominal voltage can give you benefit of low power by trading-off with top frequency and design effort.

To optimize **max current**, you could consider:
- Trade-off latency by lowering the frequency
    - Lower the frequency of compute units can help to lower the max current directly, but with sacrifice of overall latency.
- Power throttling
    - Pacing different tasks or different parts of the same task to run in sequential fashion instead of in parallel. Obviously with sacrifice of overall throughput and latency.
- DVFS (dynamic voltage and frequency scaling)
    -

To optimize **TDP**, you could consider similar mechanisms of optimizing max current, but in a much longer time frame. So instead of maneuvering tasks, you need to consider turning off power domains and functionalities for seconds to minutes until the rush hour has passed.

To optimize **energy**, you could consider:
- Optimize algorithm to find a low-power alternative.
- Use specialized hardware accelerator to replace general computing.
- Reduce external memory access, but utilize on-chip memory and cache instead.
- ... (other software, hardware and physical mechanisms)
