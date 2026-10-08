---
title: "CPU Performance Test"
date: 2024-09-30
---

## Background

i7-12700K = Intel Core i7-12700K (8 big cores each has 2 threads, 4 little cores each has 1 thread) running at 5GHz
rpi4 = Raspberry Pi 4 Rev B, with 4x Cortex-A72 running at 1.8GHz (Broadcom BCM2711)
rpi5 = Raspberry Pi 5, with 4x Coretex-A76 running at 2.4GHz (Broadcom BCM2712)
am69 = TI AM69 starter kit, with 8x Cortex-A72 running at 2.0GHz (TI AM69)
lpi4a = LiCheePi 4A, with 4x RISC-V RV64GCV running at 1.85GHz (Alibaba TH1520)
- I've tried to use both open-source GCC and T-Head's own GCC with `-mcpu=c920` support. Latter gives slightly better result.

## Summary

|                              | i7-12700K     | rpi4 (A72)  | rpi5 (A76)   | am69 (A72)   | lpi4a (RV64GCV)            |
| ---------------------------- | ------------- | ----------- | ------------ | ------------ | -------------------------- |
| # of threads                 | 20            | 4           | 4            | 8            | 4                          |
| Frequency                    | 5.0 (2.8x)    | 1.8 (1.0x)  | 2.4 (1.3x)   | 2.0 (1.1x)   | 1.85 (1.0x)                |
| Frequency x # of threads     | 100.0 (13.9x) | 7.2 (1.0x)  | 9.6 (1.3x)   | 16.0 (2.2x)  | 7.4 (1.0x)                 |
| CoreMark                     | 44385 (4.5x)  | 9820 (1.0x) | 17665 (1.8x) | 11002 (1.1x) | 8555 (0.9x); 9783 (1.0x) |
| CoreMark-Pro (Multi-Core)    | 78969 (16.0x) | 4939 (1.0x) | 12746 (2.6x) | 14102 (2.9x) | 4547 (0.9x)                |
| CoreMark-Pro (Single-Core)   | 10054 (4.5x)  | 2242 (1.0x) | 5044 (2.2x)  | 2550 (1.1x)  | 1572 (0.7x)                |
| SPEC CPU 2017 Integer        | 10.0 (5.7x)   | 1.74 (1.0x) |              |              |                            |
| SPEC CPU 2017 Floating-Point | 21.3 (11.7x)  | 1.82 (1.0x) |              |              |                            |

## SPEC CPU 2017 (intspeed)

### i7-12700K
```
                       Estimated                       Estimated
                 Base     Base        Base        Peak     Peak        Peak
Benchmarks      Threads  Run Time     Ratio      Threads  Run Time     Ratio
--------------- -------  ---------  ---------    -------  ---------  ---------
600.perlbench_s       4        154      11.5   *       4      143        12.5   *
602.gcc_s             4        304      13.1   *       4      286        13.9   *
605.mcf_s             4        467      10.1   *       4      434        10.9   *
620.omnetpp_s         4        316       5.17  *       4      292         5.59  *
623.xalancbmk_s       4        139      10.2   *       4      133        10.6   *
625.x264_s            4        105      16.7   *       4       96.9      18.2   *
631.deepsjeng_s       4        254       5.65  *       4      233         6.16  *
641.leela_s           4        283       6.03  *       4      261         6.54  *
648.exchange2_s       4        193      15.3   *       4      188        15.7   *
657.xz_s              4        791       7.81  *       4      774         7.99  *
=================================================================================
600.perlbench_s       4        154      11.5   *       4      143        12.5   *
602.gcc_s             4        304      13.1   *       4      286        13.9   *
605.mcf_s             4        467      10.1   *       4      434        10.9   *
620.omnetpp_s         4        316       5.17  *       4      292         5.59  *
623.xalancbmk_s       4        139      10.2   *       4      133        10.6   *
625.x264_s            4        105      16.7   *       4       96.9      18.2   *
631.deepsjeng_s       4        254       5.65  *       4      233         6.16  *
641.leela_s           4        283       6.03  *       4      261         6.54  *
648.exchange2_s       4        193      15.3   *       4      188        15.7   *
657.xz_s              4        791       7.81  *       4      774         7.99  *
 Est. SPECspeed(R)2017_int_base          9.41
 Est. SPECspeed(R)2017_int_peak                                           10.0
```

### rpi4
```
                       Estimated                       Estimated
                 Base     Base        Base        Peak     Peak        Peak
Benchmarks      Threads  Run Time     Ratio      Threads  Run Time     Ratio
--------------- -------  ---------  ---------    -------  ---------  ---------
600.perlbench_s       4    1314         1.35   *       4    1064         1.67   *
602.gcc_s             4      57.1             RE       4     145               RE
605.mcf_s             4    3908         1.21   *       4    3661         1.29   *
620.omnetpp_s         4    1911         0.853  *       4    1667         0.979  *
623.xalancbmk_s       4     997         1.42   *       4     932         1.52   *
625.x264_s            4     798         2.21   *       4     753         2.34   *
631.deepsjeng_s       4      10.2             RE       1         --            FE
641.leela_s           4    1086         1.57   *       4     867         1.97   *
648.exchange2_s       4     896         3.28   *       4     908         3.24   *
657.xz_s              4       9.24            RE       4       8.54            RE
=================================================================================
600.perlbench_s       4    1314         1.35   *       4    1064         1.67   *
602.gcc_s                                     NR                               NR
605.mcf_s             4    3908         1.21   *       4    3661         1.29   *
620.omnetpp_s         4    1911         0.853  *       4    1667         0.979  *
623.xalancbmk_s       4     997         1.42   *       4     932         1.52   *
625.x264_s            4     798         2.21   *       4     753         2.34   *
631.deepsjeng_s                               NR                               NR
641.leela_s           4    1086         1.57   *       4     867         1.97   *
648.exchange2_s       4     896         3.28   *       4     908         3.24   *
657.xz_s                                      NR                               NR
 Est. SPECspeed(R)2017_int_base         1.56
 Est. SPECspeed(R)2017_int_peak                                          1.74
```
## SPEC CPU 2017 (fpspeed)

### i7-12700K
```
                       Estimated                       Estimated
                 Base     Base        Base        Peak     Peak        Peak
Benchmarks      Threads  Run Time     Ratio      Threads  Run Time     Ratio
--------------- -------  ---------  ---------    -------  ---------  ---------
603.bwaves_s          4        846      69.7   *       1         --            FE
607.cactuBSSN_s       4        330      50.5   *       4     318         52.5   *
619.lbm_s             4        810       6.47  *       4     812          6.45  *
621.wrf_s             1         --            CE       1         --            CE
627.cam4_s            1         --            CE       1         --            CE
628.pop2_s            1         --            CE                               NR
638.imagick_s         4        872      16.5   *       4     724         19.9   *
644.nab_s             4        436      40.1   *       4     382         45.8   *
649.fotonik3d_s       4        642      14.2   *       4     635         14.4   *
654.roms_s            4        856      18.4   *       4       1.65            RE
=================================================================================
603.bwaves_s          4        846      69.7   *                               NR
607.cactuBSSN_s       4        330      50.5   *       4     318         52.5   *
619.lbm_s             4        810       6.47  *       4     812          6.45  *
621.wrf_s                                     NR                               NR
627.cam4_s                                    NR                               NR
628.pop2_s                                    NR                               NR
638.imagick_s         4        872      16.5   *       4     724         19.9   *
644.nab_s             4        436      40.1   *       4     382         45.8   *
649.fotonik3d_s       4        642      14.2   *       4     635         14.4   *
654.roms_s            4        856      18.4   *                               NR
 Est. SPECspeed(R)2017_fp_base           23.5
 Est. SPECspeed(R)2017_fp_peak                                            21.3
```

### rpi4

```
                           CPU2017 License: A000A                                   Test date: Mar-2024
                           Test sponsor: My Corporation                 Hardware availability: Mar-2024
                           Tested by:    My Corporation                 Software availability: Mar-2024

                       Estimated                       Estimated
                 Base     Base        Base        Peak     Peak        Peak
Benchmarks      Threads  Run Time     Ratio      Threads  Run Time     Ratio
--------------- -------  ---------  ---------    -------  ---------  ---------
603.bwaves_s          4       7.36            RE       1         --            FE
607.cactuBSSN_s       4      20.2             RE       4      92.0             RE
619.lbm_s             4   11153         0.470  *       4   11184         0.468  *
621.wrf_s             4    6369         2.08   *       1         --            FE
627.cam4_s            4      11.3             RE       1         --            FE
628.pop2_s            4    6922         1.72   *       4    6922         1.72   *
638.imagick_s         4    6436               RE       4    5629               RE
644.nab_s             4    3126         5.59   *       4    2326         7.51   *
649.fotonik3d_s       4      99.5             RE       4      99.4             RE
654.roms_s            4       9.35            RE       4       9.67            RE
=================================================================================
603.bwaves_s                                  NR                               NR
607.cactuBSSN_s                               NR                               NR
619.lbm_s             4   11153         0.470  *       4   11184         0.468  *
621.wrf_s             4    6369         2.08   *                               NR
627.cam4_s                                    NR                               NR
628.pop2_s            4    6922         1.72   *       4    6922         1.72   *
638.imagick_s                                 NR                               NR
644.nab_s             4    3126         5.59   *       4    2326         7.51   *
649.fotonik3d_s                               NR                               NR
654.roms_s                                    NR                               NR
 Est. SPECspeed(R)2017_fp_base          1.75
 Est. SPECspeed(R)2017_fp_peak                                           1.82
```

## CoreMark
### i7-12700K
```
2K performance run parameters for coremark.
CoreMark Size    : 666
Total ticks      : 13518
Total time (secs): 13.518000
Iterations/Sec   : 44385.264092
Iterations       : 600000
Compiler version : GCC11.4.0
Compiler flags   : -O2 -DPERFORMANCE_RUN=1  -lrt
Memory location  : Please put data memory location here
                        (e.g. code in flash, data on heap etc)
seedcrc          : 0xe9f5
[0]crclist       : 0xe714
[0]crcmatrix     : 0x1fd7
[0]crcstate      : 0x8e3a
[0]crcfinal      : 0xa14c
Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 44385.264092 / GCC11.4.0 -O2 -DPERFORMANCE_RUN=1  -lrt / Heap
```

### rpi4
```
2K performance run parameters for coremark.
CoreMark Size    : 666
Total ticks      : 11202
Total time (secs): 11.202000
Iterations/Sec   : 9819.675058
Iterations       : 110000
Compiler version : GCC9.4.0
Compiler flags   : -O2 -DPERFORMANCE_RUN=1  -lrt
Memory location  : Please put data memory location here
                        (e.g. code in flash, data on heap etc)
seedcrc          : 0xe9f5
[0]crclist       : 0xe714
[0]crcmatrix     : 0x1fd7
[0]crcstate      : 0x8e3a
[0]crcfinal      : 0x33ff
Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 9819.675058 / GCC9.4.0 -O2 -DPERFORMANCE_RUN=1  -lrt / Heap
```

### rpi5
```
2K performance run parameters for coremark.
CoreMark Size    : 666
Total ticks      : 16983
Total time (secs): 16.983000
Iterations/Sec   : 17664.723547
Iterations       : 300000
Compiler version : GCC13.2.0
Compiler flags   : -O2 -DPERFORMANCE_RUN=1  -lrt
Memory location  : Please put data memory location here
                        (e.g. code in flash, data on heap etc)
seedcrc          : 0xe9f5
[0]crclist       : 0xe714
[0]crcmatrix     : 0x1fd7
[0]crcstate      : 0x8e3a
[0]crcfinal      : 0xcc42
Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 17664.723547 / GCC13.2.0 -O2 -DPERFORMANCE_RUN=1  -lrt / Heap
```

### am69
```
2K performance run parameters for coremark.
CoreMark Size    : 666
Total ticks      : 18178
Total time (secs): 18.178000
Iterations/Sec   : 11002.310485
Iterations       : 200000
Compiler version : GCC11.4.0
Compiler flags   : -O2 -DPERFORMANCE_RUN=1  -lrt
Memory location  : Please put data memory location here
                        (e.g. code in flash, data on heap etc)
seedcrc          : 0xe9f5
[0]crclist       : 0xe714
[0]crcmatrix     : 0x1fd7
[0]crcstate      : 0x8e3a
[0]crcfinal      : 0x4983
Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 11002.310485 / GCC11.4.0 -O2 -DPERFORMANCE_RUN=1  -lrt / Heap
```

### lpi4a
```
2K performance run parameters for coremark.
CoreMark Size    : 666
Total ticks      : 12857
Total time (secs): 12.857000
Iterations/Sec   : 8555.650618
Iterations       : 110000
Compiler version : GCC13.2.0
Compiler flags   : -O2 -DPERFORMANCE_RUN=1  -lrt
Memory location  : Please put data memory location here
                        (e.g. code in flash, data on heap etc)
seedcrc          : 0xe9f5
[0]crclist       : 0xe714
[0]crcmatrix     : 0x1fd7
[0]crcstate      : 0x8e3a
[0]crcfinal      : 0x33ff
Correct operation validated. See README.md for run and reporting rules.
CoreMark 1.0 : 8555.650618 / GCC13.2.0 -O2 -DPERFORMANCE_RUN=1  -lrt / Heap
```
## CoreMark-Pro

### i7-12700K
```
WORKLOAD RESULTS TABLE

                                                 MultiCore SingleCore
Workload Name                                     (iter/s)   (iter/s)    Scaling
----------------------------------------------- ---------- ---------- ----------
cjpeg-rose7-preset                                 1250.00     238.10       5.25
core                                                 42.55       3.42      12.44
linear_alg-mid-100x100-sp                          2083.33     367.65       5.67
loops-all-mid-10k-sp                                122.85      15.22       8.07
nnet_test                                           178.57      18.98       9.41
parser-125k                                         350.88      35.71       9.83
radix2-big-64k                                    10309.28    1270.65       8.11
sha-test                                           1538.46     303.03       5.08
zip-test                                           2500.00     250.00      10.00

MARK RESULTS TABLE

Mark Name                                        MultiCore SingleCore    Scaling
----------------------------------------------- ---------- ---------- ----------
CoreMark-PRO                                      78968.75   10054.14       7.85
```

### rpi4
```
WORKLOAD RESULTS TABLE

                                                 MultiCore SingleCore
Workload Name                                     (iter/s)   (iter/s)    Scaling
----------------------------------------------- ---------- ---------- ----------
cjpeg-rose7-preset                                  263.16      74.63       3.53
core                                                  2.71       0.69       3.93
linear_alg-mid-100x100-sp                           241.55      62.89       3.84
loops-all-mid-10k-sp                                  4.08       2.34       1.74
nnet_test                                            11.47       3.46       3.32
parser-125k                                           8.89      11.24       0.79
radix2-big-64k                                      105.29     227.63       0.46
sha-test                                            476.19     138.89       3.43
zip-test                                            137.93      43.48       3.17

MARK RESULTS TABLE

Mark Name                                        MultiCore SingleCore    Scaling
----------------------------------------------- ---------- ---------- ----------
CoreMark-PRO                                       4939.42    2241.89       2.20
```

### rpi5
```
WORKLOAD RESULTS TABLE

                                                 MultiCore SingleCore
Workload Name                                     (iter/s)   (iter/s)    Scaling
----------------------------------------------- ---------- ---------- ----------
cjpeg-rose7-preset                                  526.32     144.93       3.63
core                                                  5.34       1.34       3.99
linear_alg-mid-100x100-sp                           515.46     136.61       3.77
loops-all-mid-10k-sp                                 17.91       7.01       2.55
nnet_test                                            26.46       7.97       3.32
parser-125k                                          43.96      31.25       1.41
radix2-big-64k                                      466.64     668.00       0.70
sha-test                                            625.00     212.77       2.94
zip-test                                            285.71      90.91       3.14

MARK RESULTS TABLE

Mark Name                                        MultiCore SingleCore    Scaling
----------------------------------------------- ---------- ---------- ----------
CoreMark-PRO                                      12746.27    5044.04       2.53
```

### am69
```
WORKLOAD RESULTS TABLE

                                                 MultiCore SingleCore
Workload Name                                     (iter/s)   (iter/s)    Scaling
----------------------------------------------- ---------- ---------- ----------
cjpeg-rose7-preset                                  588.24      82.64       7.12
core                                                  6.34       0.80       7.92
linear_alg-mid-100x100-sp                           574.71      80.13       7.17
loops-all-mid-10k-sp                                 11.12       2.66       4.18
nnet_test                                            19.80       3.71       5.34
parser-125k                                          72.07      10.75       6.70
radix2-big-64k                                      805.80     314.07       2.57
sha-test                                            769.23     153.85       5.00
zip-test                                            296.30      47.62       6.22

MARK RESULTS TABLE

Mark Name                                        MultiCore SingleCore    Scaling
----------------------------------------------- ---------- ---------- ----------
CoreMark-PRO                                      14102.14    2550.47       5.53
```

### lpi4a
```
WORKLOAD RESULTS TABLE

                                                 MultiCore SingleCore
Workload Name                                     (iter/s)   (iter/s)    Scaling
----------------------------------------------- ---------- ---------- ----------
cjpeg-rose7-preset                                  263.16      75.19       3.50
core                                                  1.88       0.47       4.00
linear_alg-mid-100x100-sp                           235.85      63.69       3.70
loops-all-mid-10k-sp                                  4.77       2.06       2.32
nnet_test                                            10.26       3.08       3.33
parser-125k                                          11.56       8.55       1.35
radix2-big-64k                                      152.98      71.35       2.14
sha-test                                            192.31      57.14       3.37
zip-test                                            121.21      33.33       3.64

MARK RESULTS TABLE

Mark Name                                        MultiCore SingleCore    Scaling
----------------------------------------------- ---------- ---------- ----------
CoreMark-PRO                                       4547.26    1571.90       2.89
```
## Ceph Perf (ceph_perf_local)
### i7-12700K
```
root@22752a5b7c8d:~/ceph/ceph.git/build/bin# ./ceph_perf_local
atomic_int_cmp               3.94ns    atomic_t::compare_and_swap
atomic_int_inc               3.72ns    atomic_t::inc
atomic_int_read              0.22ns    atomic_t::read
atomic_int_set               3.49ns    atomic_t::set
mutex_nonblock              10.51ns    Mutex lock/unlock (no blocking)
buffer_basic                16.18ns    buffer create, add one ptr, delete
buffer_encode_decode       100.52ns    buffer create, encode/decode object, delete
buffer_basic_copy           57.57ns    buffer create, copy small block, delete
buffer_copy                  4.77ns    copy out 2 small ptrs from buffer
buffer_encode10             20.64ns    buffer encoding 10 structures onto existing ptr
buffer_iterator            314.76ns    iterate over buffer with 5 ptrs
cond_ping_pong               2.41us    condition variable round-trip
div32                        1.23ns    32-bit integer division instruction
div64                        2.05ns    64-bit integer division instruction
function_call                0.27ns    Call a function that has not been inlined
eventcenter_poll           104.98ns    EventCenter::process_events (no timers or events)
eventcenter_dispatch       571.12ns    EventCenter::dispatch_event_external latency
memcpy100                    0.00ns    Copy 100 bytes with memcpy
memcpy1000                   0.00ns    Copy 1000 bytes with memcpy
memcpy10000                  0.00ns    Copy 10000 bytes with memcpy
ceph_str_hash_rjenkins       7.58ns    rjenkins hash on 16 byte of data
ceph_str_hash_rjenkins      97.54ns    rjenkins hash on 256 bytes of data
rdtsc                        5.37ns    Read the fine-grain cycle counter
cycles_to_seconds            0.87ns    Convert a rdtsc result to (double) seconds
cycles_to_seconds            1.13ns    Convert a rdtsc result to (uint64_t) nanoseconds
prefetch                  architecture nonsupport                    Prefetch instruction
serialize                  309.33ns    serialize instruction
lfence                    architecture nonsupport                    Lfence instruction
sfence                    architecture nonsupport                    Sfence instruction
spin_lock                    5.15ns    Acquire/release SpinLock
spawn_thread                 7.37us    Start and stop a thread
perf_timer                  52.17ns    Insert and cancel a SafeTimer
throw_int                  523.68ns    Throw an int
throw_int_call             652.69ns    Throw an int in a function call
throw_exception            654.67ns    Throw an Exception
throw_exception_call       891.27ns    Throw an Exception in a function call
vector_push_pop              0.55ns    Push and pop a std::vector
ceph_clock_now              11.51ns    ceph_clock_now function
```

### rpi4
```
atomic_int_cmp              18.39ns    atomic_t::compare_and_swap
atomic_int_inc              15.03ns    atomic_t::inc
atomic_int_read              4.66ns    atomic_t::read
atomic_int_set              10.57ns    atomic_t::set
mutex_nonblock              51.71ns    Mutex lock/unlock (no blocking)
buffer_basic                99.47ns    buffer create, add one ptr, delete
buffer_encode_decode       661.72ns    buffer create, encode/decode object, delete
buffer_basic_copy          407.07ns    buffer create, copy small block, delete
buffer_copy                 42.79ns    copy out 2 small ptrs from buffer
buffer_encode10             95.51ns    buffer encoding 10 structures onto existing ptr
buffer_iterator              1.65us    iterate over buffer with 5 ptrs
cond_ping_pong              21.16us    condition variable round-trip
div32                        7.25ns    32-bit integer division instruction
div64                     architecture nonsupport                    64-bit integer division instruction
function_call                3.34ns    Call a function that has not been inlined
eventcenter_poll             1.70us    EventCenter::process_events (no timers or events)
eventcenter_dispatch         6.89us    EventCenter::dispatch_event_external latency
memcpy100                   11.71ns    Copy 100 bytes with memcpy
memcpy1000                  73.09ns    Copy 1000 bytes with memcpy
memcpy10000                737.00ns    Copy 10000 bytes with memcpy
ceph_str_hash_rjenkins      37.88ns    rjenkins hash on 16 byte of data
ceph_str_hash_rjenkins     371.81ns    rjenkins hash on 256 bytes of data
rdtsc                       46.21ns    Read the fine-grain cycle counter
cycles_to_seconds            8.90ns    Convert a rdtsc result to (double) seconds
cycles_to_seconds            8.90ns    Convert a rdtsc result to (uint64_t) nanoseconds
prefetch                    59.95ns    Prefetch instruction
serialize                 architecture nonsupport                    serialize instruction
lfence                       2.80ns    Lfence instruction
sfence                       1.67ns    Sfence instruction
spin_lock                   32.36ns    Acquire/release SpinLock
spawn_thread                94.17us    Start and stop a thread
perf_timer                 375.65ns    Insert and cancel a SafeTimer
throw_int                    4.76us    Throw an int
throw_int_call               6.19us    Throw an int in a function call
throw_exception              6.10us    Throw an Exception
throw_exception_call         8.07us    Throw an Exception in a function call
vector_push_pop              1.49ns    Push and pop a std::vector
ceph_clock_now              42.88ns    ceph_clock_now function
```
## Ceph Perf (ceph_perf_objectstore)

### i7-12700K
```
root@22752a5b7c8d:~/ceph/ceph.git/build/bin# ./ceph_perf_objectstore 1000
args: [1000]
 write op: 118us count: 1000
 setattr op: 132us count: 2000
 omap_setkeys op: 238us count: 2000
 omap_rmkey op: 40us count: 1000
 encode op: 492us count: 2000
 decode op: 678us count: 2000
 iterate op: 667us count: 2000
 Total rados op 1000 run time 2746us.
```

### rpi4
```
root@ceph0d:/mnt/usb1# ~/ceph/build/bin/ceph_perf_objectstore 1000
args: [1000]
 write op: 952us count: 1000
 setattr op: 868us count: 2000
 omap_setkeys op: 1709us count: 2000
 omap_rmkey op: 318us count: 1000
 encode op: 2716us count: 2000
 decode op: 4127us count: 2000
 iterate op: 4429us count: 2000
 Total rados op 1000 run time 18000us.
```
