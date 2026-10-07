---
title: "shortcut.py A Command Line Script to Provide Macro"
date: 2019-02-11
aliases:
  - "/blog/tool/2019-02-11-shortcut-dot-py/"
---

## Typical usage

### `go` to some directory use short alias

```
> pwd
/home/jw
> go prj0
cd /work/projects/design/master-branch/
> pwd
/work/projects/design/master-branch/
```

### `run` a serial of commands use short alias

```
> run vnc
ssh -L 5901:remote-internal-server-name:5901 jw@remote-gateway-ip
vncviewer remote-internal-server-name
```

### Search available alias

Here `.` dot is used to replace `*` star because `zsh` will try to expand `*` by default.

```
> go
prj0
> go p.
prj0
> run
vnc
```

### Auto-correction

`shortcut.py` uses `difflib.get_close_matches` to auto-correct the alias.

## Configuration files

* Location
  + `~/.shortcut/`
* Naming conventions
  + Ex. `go.cfg` for `go` command and `run.cfg` for `run` command
* Format

```
// comments
// filename: ~/.shortcut/go.cfg

# prj0
cd /work/projects/design/master-branch/
```

```
// filename: ~/.shortcut/run.cfg

# vnc
ssh -L 5901:remote-internal-server-name:5901 jw@remote-gateway-ip
vncviewer remote-internal-server-name
```

## How-to

1. Download [shortcut.py](https://github.com/phdbreak99/config/blob/master/script/shortcut.py) to `~/script/shortcut.py`
2. Create your own `~/.shortcut/*.cfg` file
3. Add the following lines into your `.zshrc`

```
shortcut () {
    local cmd
    cmd=$(python3 ~/script/shortcut.py $@)
    eval ${cmd}
}
alias go=`shortcut go`
alias run=`shortcut run`
```
