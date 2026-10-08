---
title: "NV's DIGITS for On-Premise AI"
date: 2025-01-15
---

**TL;DR**

Nvidia’s DIGITS offers an on-premise AI solution aimed at smaller organizations that require strict data privacy. While it is cost-effective for small businesses and college research labs, it may be less suitable for larger enterprises or for widespread adoption in typical households.

---

From my perspective, Nvidia’s new DIGITS system, showcased at CES 2025, is designed to meet the needs of smaller organizations, such as doctors’ offices, law/CPA firms and academic research labs, that require AI capabilities but must keep privacy-sensitive data on-premise. Due to strict legal and regulatory constraints, these organizations often cannot upload proprietary information to cloud-based APIs (like those offered by OpenAI or Google). Instead, they need local storage, indexing, search, and AI computation.

DIGITS addresses these requirements by offering storage capacity, memory, and compute power tailored to these specific use cases. Typical AI usage in such environments involves only a few requests per second and can tolerate modest latency. Hence, a GB10-level GPU with hundreds of GiB of LPDDR memory should suffice to run inference for models up to 200 billion parameters. If larger models or multiple smaller ones are needed, the customer can add a second DIGITS unit and enable model parallelization via high-speed interconnects. However, that represents the current scale limit.

On the storage side, 4 TiB of local disk is more than enough for data embeddings and text-based content. Organizations needing additional space can easily use that local storage as a cache, backed by a larger networked file system.

You might wonder why this solution targets smaller businesses rather than large enterprises. Simply put, larger companies can afford more cost-effective private data centers, which can scale to serve higher volumes of concurrent requests. Meanwhile, the $3,000 cost and the Linux-based operating system might not be practical for most households unless AI applications become a ubiquitous part of everyday life.

Another important consideration is the cost of renting compute in the cloud vs. TCO (total cost of ownership) of DIGITS. Currently, renting an H100 GPU exclusively can run about $2,700 per month, almost equivalent to the price tag of a DIGITS system. However, if an organization can work with a pay-per-use model rather than needing exclusive hardware, the ongoing costs will be much lower. And as more large-scale AI infrastructure is built out, rental fees will likely drop dramatically, potentially tipping the economic balance toward cloud solutions for many use cases.
