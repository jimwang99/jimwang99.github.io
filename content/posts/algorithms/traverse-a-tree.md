---
title: "Traverse a tree"
date: 2024-06-01
date_estimated: true
---

**DFS (depth first search)**

DFS can be done easily with **recursive** method, because you can treat the subtrees as new trees and use the same function to traverse them.

**BFS (breadth first search)**

BFS will need extra space of a queue. When visiting a node, add all its children to this queue, before visiting its siblings by dequeue from the queue.
