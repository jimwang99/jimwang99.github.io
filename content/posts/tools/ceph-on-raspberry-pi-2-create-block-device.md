---
title: "Ceph on Raspberry Pi (2) Create Block Device"
---

Taking my home lab Ceph distributed storage system on Raspberry Pi to the next level: make it useful by creating a block device interface so that Linux system can mount it and use it.

# Enable client

1. Install Ceph package on client
```
sudo apt install ceph-common
```

2. Generate config and keyring on admin host
```
sudo ceph config generate-minimal-conf
sudo ceph auth get-or-create client.fs
```

3. Copy generated config file and keyring file from admin host to client. Config file is at `/etc/ceph/ceph.conf`, keyring file is at `/etc/ceph/ceph.client.admin.keyring`

# Create Ceph block device

## Create pool for RBD (RADOS Block Device)

On admin host:
```
$ sudo ceph osd pool create rbd_replica
pool 'rbd_replica' created
$ sudo ceph osd pool create rbd_erasure erasure
pool 'rbd_erasure' created
```

This command will create a pool named "rbd_replica" with 3-replication for RDB metadata, and a pool named "rbd_erasure" with erasure coding for data.

> Since I've got only 120x2x4 GB storage in total, I'm trading off performance to get higher storage efficiency.

> Erasure-coded pools do not support omap, so to use them with RBD and CephFS you must instruct them to store their data in an EC pool and their metadata in a replicated pool.

Now you can check status:
```
$ sudo ceph osd pool ls
device_health_metrics
rbd_replica
rbd_erasure
```

Enable overwrites on erasure-coded pool
```
$ sudo ceph osd pool set rbd_erasure allow_ec_overwrites true
set pool 2 allow_ec_overwrites to true
```

Then
```
$ sudo rbd pool init rbd_replica
$ sudo rbd pool init rbd_erasure
```

## Remove a pool (CAREFUL)

Removing a pool by default is not allow because it can cause unrecoverable data loss. Therefore you need to turn on the flag manually first.
```
sudo ceph config set mon mon_allow_pool_delete true
```

Then:
```
sudo ceph osd pool rm <NAME> <NAME> --yes-i-really-really-mean-it
```

> NOTICE: you must be 100% sure about what you are doing. And the command requires you to type the pool name twice.

After it's done, change the flag back to false
```
sudo ceph config set mon mon_allow_pool_delete false
```


## Create block device image

Create a block device `foo` by putting metadata on `rbd_replica` and data on `rbd_erasure`
```
sudo rbd create --size 16G --data-pool rbd_erasure rbd_replica/foo
```

Create a block device `bar` directly on `rbd_replica`
```
sudo rbd create --size 4G rbd_replica/bar
```

Then you can check their status:
```
$ sudo rbd ls rbd_replica
bar
foo
```

```
$ sudo rbd info rbd_replica/foo
rbd image 'foo':
        size 16 GiB in 4096 objects
        order 22 (4 MiB objects)
        snapshot_count: 0
        id: d52de52475c1
        data_pool: rbd_erasure
        block_name_prefix: rbd_data.3.d52de52475c1
        format: 2
        features: layering, exclusive-lock, object-map, fast-diff, deep-flatten, data-pool
        op_features:
        flags:
        create_timestamp: Sun Mar 24 10:48:20 2024
        access_timestamp: Sun Mar 24 10:48:20 2024
        modify_timestamp: Sun Mar 24 10:48:20 2024
```

```
$ sudo rbd info rbd_replica/bar
rbd image 'bar':
        size 4 GiB in 1024 objects
        order 22 (4 MiB objects)
        snapshot_count: 0
        id: d527aa7d4b82
        block_name_prefix: rbd_data.d527aa7d4b82
        format: 2
        features: layering, exclusive-lock, object-map, fast-diff, deep-flatten
        op_features:
        flags:
        create_timestamp: Sun Mar 24 10:47:16 2024
        access_timestamp: Sun Mar 24 10:47:16 2024
        modify_timestamp: Sun Mar 24 10:47:16 2024
```

# Mount block device on client

After config file and keyring file are copied over to client, now we can see rbd images on client:
```
$ sudo rbd list rbd_replica
bar
foo
```

## Map

Map RDB device on client
```
$ sudo rbd device map rbd_replica/foo --id admin
/dev/rbd0
$ sudo rbd device map rbd_replica/bar --id admin
/dev/rbd1
```

Then you can check status:
```
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
...
rbd0        252:0    0    16G  0 disk
rbd1        252:16   0     4G  0 disk
```

## Format

Format both RDB block device with xfs
```
$ sudo mkfs.xfs /dev/rbd1
meta-data=/dev/rbd1              isize=512    agcount=8, agsize=131072 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=1, sparse=1, rmapbt=0
         =                       reflink=1    bigtime=1 inobtcount=1 nrext64=0
data     =                       bsize=4096   blocks=1048576, imaxpct=25
         =                       sunit=16     swidth=16 blks
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=16384, version=2
         =                       sectsz=512   sunit=16 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
Discarding blocks...Done.
```

```
$ sudo mkfs.xfs /dev/rbd0
meta-data=/dev/rbd0              isize=512    agcount=16, agsize=262144 blks
         =                       sectsz=512   attr=2, projid32bit=1
         =                       crc=1        finobt=1, sparse=1, rmapbt=0
         =                       reflink=1    bigtime=1 inobtcount=1 nrext64=0
data     =                       bsize=4096   blocks=4194304, imaxpct=25
         =                       sunit=16     swidth=16 blks
naming   =version 2              bsize=4096   ascii-ci=0, ftype=1
log      =internal log           bsize=4096   blocks=16384, version=2
         =                       sectsz=512   sunit=16 blks, lazy-count=1
realtime =none                   extsz=4096   blocks=0, rtextents=0
Discarding blocks...Done.
```

## Mount

```
sudo mkdir /mnt/foo
sudo mount /dev/rbd0 /mnt/foo
sudo mkdir /mnt/bar
sudo mount /dev/rbd0 /mnt/bar
```

# Performance test

I'm using `fio`'s predefined workload to test IO performance.

> https://github.com/axboe/fio


## Install `fio`
```
sudo apt install fio
```

## Run fio
```
cd /mnt/foo
fio --profile=tiobench
cd /mnt/bar
fio --profile=tiobench
```
## Performance of erasure-coded RBD
```
  Run status group 0 (all jobs):
  WRITE: bw=174KiB/s (179kB/s), 174KiB/s-174KiB/s (179kB/s-179kB/s), io=31.0MiB (32.5MB), run=182028-182028msec

Run status group 1 (all jobs):
  WRITE: bw=166KiB/s (170kB/s), 166KiB/s-166KiB/s (170kB/s-170kB/s), io=31.0MiB (32.5MB), run=191770-191770msec

Run status group 2 (all jobs):
   READ: bw=1877KiB/s (1922kB/s), 1877KiB/s-1877KiB/s (1922kB/s-1922kB/s), io=31.0MiB (32.5MB), run=16921-16921msec

Run status group 3 (all jobs):
   READ: bw=2138KiB/s (2190kB/s), 2138KiB/s-2138KiB/s (2190kB/s-2190kB/s), io=31.0MiB (32.5MB), run=14853-14853msec

Disk stats (read/write):
  rbd0: ios=15794/15910, merge=0/4, ticks=31386/374423, in_queue=405809, util=46.18%
```

### CPU and memory usage
15%~20% of CPU and 2.5%~5.0% of memory per OSD on Raspberry Pi 4

## Performance of 3-replication RBD
```
Run status group 0 (all jobs):
  WRITE: bw=274KiB/s (281kB/s), 274KiB/s-274KiB/s (281kB/s-281kB/s), io=31.0MiB (32.5MB), run=115858-115858msec

Run status group 1 (all jobs):
  WRITE: bw=271KiB/s (278kB/s), 271KiB/s-271KiB/s (278kB/s-278kB/s), io=31.0MiB (32.5MB), run=117033-117033msec

Run status group 2 (all jobs):
   READ: bw=3401KiB/s (3482kB/s), 3401KiB/s-3401KiB/s (3482kB/s-3482kB/s), io=31.0MiB (32.5MB), run=9339-9339msec

Run status group 3 (all jobs):
   READ: bw=6406KiB/s (6560kB/s), 6406KiB/s-6406KiB/s (6560kB/s-6560kB/s), io=31.0MiB (32.5MB), run=4958-4958msec

Disk stats (read/write):
  rbd1: ios=15814/15900, merge=0/4, ticks=14051/233277, in_queue=247327, util=52.92%
```

### CPU and memory usage
10~15% of CPU and 2.5~3.0% of memory per OSD on Raspberry Pi 4

## Reference

### Macbook Air
```
Run status group 0 (all jobs):
  WRITE: bw=381MiB/s (399MB/s), 381MiB/s-381MiB/s (399MB/s-399MB/s), io=12.9MiB (13.6MB), run=34-34msec

Run status group 1 (all jobs):
  WRITE: bw=112MiB/s (117MB/s), 112MiB/s-112MiB/s (117MB/s-117MB/s), io=12.9MiB (13.6MB), run=116-116msec

Run status group 2 (all jobs):
   READ: bw=71.5MiB/s (74.9MB/s), 71.5MiB/s-71.5MiB/s (74.9MB/s-74.9MB/s), io=12.9MiB (13.6MB), run=181-181msec

Run status group 3 (all jobs):
   READ: bw=47.4MiB/s (49.7MB/s), 47.4MiB/s-47.4MiB/s (49.7MB/s-49.7MB/s), io=12.9MiB (13.6MB), run=273-273msec
```

### Synology NFSv4
```
Run status group 0 (all jobs):
  WRITE: bw=5272KiB/s (5398kB/s), 5272KiB/s-5272KiB/s (5398kB/s-5398kB/s), io=12.9MiB (13.6MB), run=2513-2513msec

Run status group 1 (all jobs):
  WRITE: bw=6497KiB/s (6653kB/s), 6497KiB/s-6497KiB/s (6653kB/s-6653kB/s), io=12.9MiB (13.6MB), run=2039-2039msec

Run status group 2 (all jobs):
   READ: bw=14.4MiB/s (15.1MB/s), 14.4MiB/s-14.4MiB/s (15.1MB/s-15.1MB/s), io=12.9MiB (13.6MB), run=897-897msec

Run status group 3 (all jobs):
   READ: bw=14.4MiB/s (15.1MB/s), 14.4MiB/s-14.4MiB/s (15.1MB/s-15.1MB/s), io=12.9MiB (13.6MB), run=896-896msec
```

### USB3.0 thumb drive on Macbook Air
```
Run status group 0 (all jobs):
  WRITE: bw=25.8MiB/s (27.0MB/s), 25.8MiB/s-25.8MiB/s (27.0MB/s-27.0MB/s), io=12.9MiB (13.6MB), run=502-502msec

Run status group 1 (all jobs):
  WRITE: bw=10.2MiB/s (10.7MB/s), 10.2MiB/s-10.2MiB/s (10.7MB/s-10.7MB/s), io=12.9MiB (13.6MB), run=1267-1267msec

Run status group 2 (all jobs):
   READ: bw=4287KiB/s (4390kB/s), 4287KiB/s-4287KiB/s (4390kB/s-4390kB/s), io=12.9MiB (13.6MB), run=3090-3090msec

Run status group 3 (all jobs):
   READ: bw=4452KiB/s (4558kB/s), 4452KiB/s-4452KiB/s (4558kB/s-4558kB/s), io=12.9MiB (13.6MB), run=2976-2976msec
```
