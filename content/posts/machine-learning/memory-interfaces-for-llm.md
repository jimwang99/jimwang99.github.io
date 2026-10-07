---
title: "Memory Interfaces for LLM"
---

LLM is a memory bound problem. This inspired me to look at different memory technologies. In this article, I'm going to summarize my research these days, especially about HBM and its impact on AI applications.

# History

Before we dive deep into SOTA (state of the art) memory interfaces, we need to understand the history briefly.

## SDRAM (early 1990s)
- SDRAM = Synchronous Dynamic Random-Access Memory
- Comparing to DRAM chips before it, it added clock signals to make the interface synchronous (again)

## DDR (late 1990s - nowadays)
- DDR = Double Data Rate Synchronous Dynamic Random-Access Memory
- Comparing to SDRAM chips, it uses both the rising and falling edges of the clock to transmit data. Thus, doubled the data rate
- Latest DDR standard is DDR5-7200, whose highest transfer rate is 7200 MT/s
## LPDDR
- Low-power version DDR, made specially for mobile devices
    - LPDDR SDRAMs use lower bit-width (16 or 32 bits, versus 64-bit in DDR)
    - They also use DVS (dynamic voltage scaling) to save power
- Latest LPDDR standard is LPDDR5, whose transfer rate is 6400 MT/s
## GDDR
- High-bandwidth version DDR, made specially for GPUs
- Latest GDDR standard is GDDR6W, whose transfer rate is 22 GT/s

## HBM
- HBM = High Bandwidth Memory
- Comparing to normal DDR's normal DIMM or SODIMM package, HBM utilizes MCM (multi-chip module) packaging technology and 3D IC stacking technology, to achieve better bandwidth and power consumption comparing to all the other memory technologies
- The latest HBM3E can achieve 9.2Gbps per pin, with 1024 IO pins, single HBM3E chip can achieve 1.2TB/s

# Technology details

## HBM
There are 2 key technologies that enables HBM:
- MCM packaging
- IC stacking with TSV (through-silicon vias)

![hbm-block-diagram](/legacy-media/hbm-block-diagram.png)

**Multi-chip module packaging** is putting multiple dies inside the same package. There are 2 ways to do this. The usual way (less expensive), multiple dies are connected through package substrate. The package substrate is made of the same material with high-end PCBs, but with higher routing density. Unfortunately package substrate is not enough for HBM's density requirements, therefore it needs a silicon interposer which is made of the same material of a silicon die. Obviously its cost is way much higher than package substrate.

Because MCM is expanding the layout of chips on the PCB, it's also called 2.5D packaging.

**IC stacking** is called 3D packaging because it's expanding the layout of chips in Z dimension by stacking dies on top of each other. It's common technology for DRAM packing nowadays. In HBM, DRAM dies are stacked on top of controller die, while the controller die is sitting on top of the silicon interposer which connected it with the core computational silicon, ie. GPU or TPU. The DRAM dies are connected to the controller die using TSV (through-silicon vias) in the Z dimension.

As we can see, with HBM technology, the interconnect from core silicon to DRAM silicon is shorter in length and higher in density. Therefore it can achieve 1024-bit parallel data interface, comparing to 16 to 32-bit in DDR interfaces. Because the data interface is wider, it can use slower clock frequency to save power and reduce signal integrity issues.

# Comparison

**HBM** has higher bandwidth with the same real-estate and much lower power consumption, because the wider signal bus travels shorter paths in a lower frequency. But it requires an addition silicon interposer, which drives the cost a lot higher. The cost includes the engineering effort and manufacture complexity. Thanks to its relatively low frequency, its signal integrity challenge is lower than GDDR. Since it's still "new" technology as of 2013, the engineering cost to enable it is high. Therefore, HBM is suitable for cutting edge technology, such as AI and block-chain, which requires high performance and is less cost sensitive.

**GDDR** has good bandwidth improvements, comparing to normal DDR, but it also brings higher frequency and more expensive memory dies. Due to its high frequency, signal integrity is a big issue for packaging and PCB design. GDDR is usually used in GPUs for gaming and video processing.

**DDR** is mature technology, despite its frequency is going higher every generations. It's used everywhere from cloud servers to personal computers. Normally we expect DDR to support SODIMM packaging, which imposes challenges to signal integrity on long-run signals on motherboard PCB and SODIMM slots. Some other important factors of DDR are cost and density.

**LPDDR** is also pretty mature now. It's used in mobile devices, such as cellphones, which has lower thermal envelope and power budget. Lower power and lower energy dissipation are the main challenge of LPDDR. Sometimes, we have to trade-off capacity to get better power consumption. But due to its optimization towards low power, it usually use soldered packaging instead of DIMM, which drives up its cost higher than normal DDR.

|  | Bandwidth | Power | Frequency | Engineering Effort | Cost | Use-Case |
| ---- | ---- | ---- | ---- | ---- | ---- | ---- |
| HBM | Highest | Low | Low | Highest | Highest | AI |
| GDDR | High | High | High | High | High | GPU |
| DDR | Medium | Medium | Medium | Low | Low | Cloud / Consumer |
| LPDDR | Low | Lowest | Medium | Medium | Medium | Mobile |

# Impact on AI

AI model inferences require very high memory bandwidth, especially with Transformer which is the core building blocks of LLM (large language model) and ViT (vision transformer) models.

Meta's open-source LlaMA2 model has 7B, 13B, 35B and 70B versions. 70B means it has 70 billion parameters, which translate into 280GB of weights and biases assuming they are 32-bit floating point. If we are targeting 10 ~ 100 tokens per second inference, only for parameters, we need to achieve 2.8TB/s ~ 28TB/s read bandwidth. More over, we have all the activations need to store for training. Even we take account of parameter compression, FlashAttention techniques and more incoming future optimization, **transformer is a memory bound problem.** Therefore, faster and lower power memory technology like HBM will be a key technology to enable smarter and wider adoption of AI.
