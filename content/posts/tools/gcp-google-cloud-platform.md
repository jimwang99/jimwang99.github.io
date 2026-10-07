---
title: "GCP (Google Cloud Platform)"
date: 2018-10-21
aliases:
  - "/blog/tool/2018-10-21-google-cloud-platform-tips/"
---

## Price of GCP

### Persistance Disk

Can be used to put all the data/eda/os on it.

|  | Price (per month) | Price (per GB per month) |
| --- | --- | --- |
| SSD 50GB | $8.50 | $0.17 |
| SSD 1TB | $174.08 | $0.17 |
| HDD 50GB | $2.00 | $0.04 |
| HDD 200GB | $8.00 | $0.04 |
| HDD 1TB | $39.76 | $0.04 |
| Snapshot 50GB | $1.30 | $0.026 |

### Always on instance (24x7)

Can be used as working machine (support VNC) and NFS server

|  | vCPU | RAM (GB) | Price (per month) |
| --- | --- | --- | --- |
| f1-micro | Shared | 0.60 | Free |
| g1-small | Shared | 1.70 | $13.80 |
| **n1-std-1** | 1 | 3.75 | $24.27 |
| n1-std-2 | 2 | 7.50 | $48.55 |

### Instance for EDA (10 hours per week, 43.452 hours per month)

|  | vCPU | RAM (GB) | Price (per month) | Price (per hour) |
| --- | --- | --- | --- | --- |
| n1-cpu-8 | 8 | 7.2 | $12.32 | $0.2835 |
| n1-std-8 | 8 | 30 | $16.51 |  |
| n1-mem-8 | 8 | 52 | $20.58 |  |
| n1-cpu-16 | 16 | 14.4 | $24.65 | $0.5673 |
| n1-std-16 | 16 | 60 | $33.02 | $0.7599 |
| n1-cpu-32 | 32 | 28.8 | $49.29 | $1.1344 |

At the meantime, secondhand server on unixsurplus is “E5-2620 V3 10-CORE 2.4GHz” with “64GB DDR4” and “300GB HDD” is $1,989. It’s n1-std-16 for 2617 hours, 261.7 weeks if 10 hours per week.
