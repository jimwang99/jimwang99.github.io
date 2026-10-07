---
title: "Docker for EDA"
date: 2018-10-01
aliases:
  - "/blog/tool/2018-10-01-docker-tips/"
---

## Dockerfile

```
FROM ubuntu:16.04
COPY ./boot.sh /tmp
COPY ./hello.sh /tmp
RUN /bin/bash /tmp/boot.sh
RUN /bin/bash /tmp/hello.sh
```

## boot.sh

```
apt-get update; apt-get install -y make autoconf g++ flex bison wget
cd /tmp
wget https://www.veripool.org/ftp/verilator-4.004.tgz
tar xf verilator*.tgz
cd verilator*
./configure
make # this step will take sometime
make install
```

## hello.sh

```
cd /tmp/verilator*
cd ./example/tracing_c
make

# it will print out some log, and after finish it will generate a directory in the same directory named "logs" who needs to be saved after container exit
```

## Docker how-to notes

### create a docker image from Dockerfile

```
docker build -t "$(name):$(tag)" .; # in a directory with Dockerfile

docker run -dit --name $(name) $(name):$(tag); # -d: detach, -i: interactive, -t: tty

docker ps; # use -a to list exited docker; use "docker rm" to remove useless containers

docker exec -it $(name) /bin/bash; # run bash in guest and connect to it

docker commit -m "install/test verilator-4.004" -a "jw" $(name) $(new_name):$(new_tag); # -m: message, -a: author, with new name and tag

docker image ls; # and the image is 797MB large comparing to eda:0.0's 116MB; use "docker image rm" to remove useless docker images
```

### save file to host

```
# mount a host dir to guest /mnt/result
DATE=`date '+%Y%m%d_%H%M%S'`
mkdir result_${DATE}
docker run -it -v ${PWD}/result_${DATE}:/mnt/result eda:0.1 /bin/bash

# in guest, copy files to /mnt/result afterwards
# but the files in result_${DATE} will have permission of root:root
# the easiest way to fix the problem is in host do:
sudo chown -R $(id -u) ./result_${DATE}
sudo chown -R $(id -g) ./result_${DATE}
```

### stop

```
docker stop $(name)
```
