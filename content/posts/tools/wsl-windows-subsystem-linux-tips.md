---
title: "WSL (Windows Subsystem Linux) Tips"
date: 2017-04-25
---

## To start gnome-terminal on WSL (Windows Subsystem for Linux)

After upgrade to Windows 10 Creators Update, reinstall WSL will have Ubuntu 16.04.2 LTS on Windows.

To reinstall WSL you should do:

```
> lxrun /uninstall /full
> lxrun /install
```

Then you will see

```
> lsb_release -a
No LSB modules are available.
Distributor ID: Ubuntu
Description:    Ubuntu 16.04.2 LTS
Release:        16.04
Codename:       xenial
```

Some X11 apps like xclocks works fine with Xming, but “gnome-terminal” still have some problem.

```
gnome-terminal
process 5260: D-Bus library appears to be incorrectly set up; failed to read machine uuid: UUID file '/etc/machine-id' should contain a hex string of length 32, not length 0, with no other text
See the manual page for dbus-uuidgen to correct this issue.
Error constructing proxy for org.gnome.Terminal:/org/gnome/Terminal/Factory0: Error spawning command line 'dbus-launch --autolaunch= --binary-syntax --close-stderr': Child process exited with code 1
```

I found that the `/etc/machine-id` file is empty, and it can be fixed by `sudo systemd-machine-id-setup`

I was using OSX on my 2015 MBP for almost 2 years and it works fine. After spending some time to tune the iTerm2’s color and hotkey settings, the environment works fine with SSH, TMUX, ZSH and VIM. It did took me quite some time to compile Verilator (an open source Verilog simulator) on OSX. Other than that the biggest problem would be external 1080p monitor and HDMI connection. It always looks blurry after trying out all the solutions I can find on Google. The ultimate solution was change the monitor from 1080p to real 4K. Apparently, OSX is not for poor people.

But after 2 years of enduring the overheating and fast battery drainage, I’ll have to move on to better hardware. Macbook won’t be an option at all because I cannot get used to this new keyboard. It’s without travelling distance at all, and typing with it is just like typing on a piece of wood. So Windows.

Nowadays, Windows comes with WSL (Windows subsystem Linux). It gives you the ability to run native Linux program within a virtual machine liked environment on Windows machine. Although Microsoft claims that it’s not for X programs, some hackers indeed made X work for WSL. But with integration with native Windows filesystem, X is not that critical anymore, because anyway I cannot run real EDA tools on WSL. So it’s only for development which means VIM and Python would be enough.

### WSL terminal

[WSL terminal](https://github.com/goreliu/wsl-terminal) is a very useful tool for using WSL. It comes with a mintty and one very useful setting: add “open wsl terminal here” to your right click menu. However the native color themes are not good. What I chose is to match all my other tools’ ]“Dracula” theme](<https://draculatheme.com/>)

Another problem that worth mentioning is the directory color of Windows filesystem. Because of the default permission, every directories in /mnt/c or /mnt/d are 777. So they are displayed as **green background plus gray foreground** font, which is very hard to recognize. The way to fix it is to put `export LS_COLORS='ow=01;36;40` in the `.zshrc` to change the color output of `ls` command. One drawback is this cannot change the color for zsh auto-completion.

### Copy to Windows clipboard

```
cat $FILE | clip.exe
```

Here `clip.exe` is a native windows program at `/mnt/c/Windows/System32/clip.exe`

It’s a little bit tricky to copy from VIM to Windows clipboard though. But some smart guy on stackoverflow thought of a [work-around](https://stackoverflow.com/questions/44480829/how-to-copy-to-clipboard-in-vim-of-bash-on-windows) using clip.exe

```
func! GetSelectedText()
    normal gv"xy
    let result = getreg("x")
    return result
endfunc
if !has("clipboard") && executable("clip.exe")
    noremap <C-C> :call system('clip.exe', GetSelectedText())<CR>
endif
```
