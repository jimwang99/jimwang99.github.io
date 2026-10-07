---
title: "🚧 A simple system metric collector"
---

https://github.com/jimwang99/jimon

While experimenting my little distributed storage system built with Raspberry Pi SBCs and Ceph, some Raspberry Pi machines die now and then. My suspicion is heat, because I built them with cases, even though the cases come with attached heat sinks and fans. Therefore I built this small open-source project to help me collect system metrics periodically on Linux and send them to a server. The server store the metrics in a SQLite3 database, so that I can use a Python script to pull them out and check my small servers' status and if they died what is the cause.


![jimon-diagram](/legacy-media/jimon-diagram.png)
