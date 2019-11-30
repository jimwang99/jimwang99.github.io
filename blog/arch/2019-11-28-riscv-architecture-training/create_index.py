#!/usr/bin/env python3.7

import os
import sys
import glob

def get_title(fpath):
    title = None
    with open(fpath) as f:
        for line in f:
            if (line.startswith('title:')):
                idx = line.find(')')
                title = line[idx+1:].strip()
    return title


s_header='''---
title: "[RISC-V Architecture Training] Dec. 2019 verion: Full List"
date: 2019-11-28
categories:
  - riscv
---

## List of training content

'''

with open('list.md', 'w') as f:
    f.write(s_header)
    ls = sorted(glob.glob('lecture-*.md'))
    for fpath in ls:
        f.write('### [{}]({}/index.html)\n\n'.format(get_title(fpath), os.path.splitext(fpath)[0]))
        print('** ' + fpath)

