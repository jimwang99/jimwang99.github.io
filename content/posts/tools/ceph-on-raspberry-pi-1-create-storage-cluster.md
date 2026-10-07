---
title: "Ceph on Raspberry Pi (1) Create Storage Cluster"
---

Trying to follow this tutorial to create a Ceph distributed storage system in my home lab, because I'm sick of the NFS performance of my Synology NAS.
https://ceph.io/en/news/blog/2022/install-ceph-in-a-raspberrypi-4-cluster/
## Prepare

### Prepare Ubuntu 20.04
Download ubuntu server 20.04 for Raspberry Pi (arm64 architecture)
```
sudo apt install -y python3 systemd docker.io chrony lvm2 cephadm ceph-common
```

### Prepare USB storage

## Install Ceph use `cephadm`

### `bootstrap` on the admin host

> On admin host

Here my admin host's IP address is 192.168.68.65
```
sudo cephadm bootstrap --mon-ip 192.168.68.65
```

## Add more hosts

### Enable SSH access use root account

> On additional hosts

1. Give root a password so that we can login use root
```
sudo passwd root
```

2. Allow root to login via SSH
```
sudo vi /etc/ssh/sshd_config
```

3. Change the following line
```
PermitRootLogin yes
```

4. Restart sshd
```
sudo systemctl restart sshd
```

### Copy SSH key from admin host

> On admin host

Here my additional host's IP address is 192.168.68.66
```
ssh-copy-id -f -i /etc/ceph/ceph.pub root@192.168.68.66
```

```
ssh-copy-id -f -i /etc/ceph/ceph.pub root@192.168.68.67
```

```
ssh-copy-id -f -i /etc/ceph/ceph.pub root@192.168.68.68
```

### Add more hosts

> On admin host

Here my additional hosts' IP addresses are 192.168.68.66/67/68
```
sudo ceph orch host add ceph0b 192.168.68.66
```

```
sudo ceph orch host add ceph0c 192.168.68.67
```

```
sudo ceph orch host add ceph0d 192.168.68.68
```

Then you will see:
```
$ sudo ceph orch host ls
HOST    ADDR           LABELS  STATUS
ceph0a  ceph0a
ceph0b  192.168.68.66
ceph0c  192.168.68.67
ceph0d  192.168.68.68
```
## Prepare storage

I've got 2x 128GB USB drives for each of my Raspberry Pi 4 machine. They came with formatted exFAT file system. To get it ready for Ceph, we need to remove those partitions.

> You may need to be innovative here, because there is no fit-all solution.

```
sudo fdisk /dev/sda
```

Then use `d` and `w` to remove all file system the disk. NOTE: be sure to enter the right device name.

### Useful commands

```
lsblk # list information about block devices
umount # un-mount a partition
wipefs # Wipe signatures from a device
```

For new devices, you probably also need to do
```
sudo dd if=/dev/zero of=/dev/sdb bs=1M count=1000 conv=sync
```

Like myself, I need to delete the old ceph partitions, I used
```
sudo wipefs -a -f /dev/sda
sudo wipefs -a -f /dev/sdb
sudo reboot
```

Then the result of `lsblk` changes from
```
sda                                                                                                     8:0    1 119.5G  0 disk
└─ceph--501ab020--f4a0--43ce--afa8--79b85a197767-osd--block--0c02cb0c--ac18--43a6--91f8--6df677236779 253:0    0 119.5G  0 lvm
sdb                                                                                                     8:16   1 119.5G  0 disk
└─ceph--f8ae8aa8--a882--41ec--8a4f--3db842551ed1-osd--block--2f6d3007--b329--48f9--afc0--85eb4ce5a60a 253:1    0 119.5G  0 lvm
```
to
```
sda           8:0    1 119.5G  0 disk
sdb           8:16   1 119.5G  0 disk
```

> Last resort: write zeros to the device. NOTE: double check the target device path!!!

```
sudo dd if=/dev/zero of=/dev/sda bs=4M status=progress
```

### Check storage

```
sudo cephadm shell ceph-volume inventory
```

And you should see:
```
Device Path               Size         rotates available Model name
/dev/sda                  119.51 GB    True    True      Flash Drive FIT
/dev/sdb                  119.51 GB    True    True      Flash Drive FIT
/dev/mmcblk0              58.94 GB     False   False
```

## Add OSD

> On admin host

```
sudo eph orch apply osd --all-available-devices
```

Check if devices are ready or not
```
sudo ceph orch device ls
```

And you should see:
```
Hostname  Path      Type  Serial            Size   Health   Ident  Fault  Available
ceph0a    /dev/sda  hdd   0374423070005261   128G  Unknown  N/A    N/A    No
ceph0a    /dev/sdb  hdd   0347923070005038   128G  Unknown  N/A    N/A    No
ceph0b    /dev/sda  hdd   0362223070007964   128G  Unknown  N/A    N/A    No
ceph0b    /dev/sdb  hdd   0374923070005055   128G  Unknown  N/A    N/A    No
ceph0c    /dev/sda  hdd   0374023070005660   128G  Unknown  N/A    N/A    No
ceph0c    /dev/sdb  hdd   0346923070003506   128G  Unknown  N/A    N/A    No
ceph0d    /dev/sda  hdd   0374723070005331   128G  Unknown  N/A    N/A    No
ceph0d    /dev/sdb  hdd   0370823070002596   128G  Unknown  N/A    N/A    No
```
