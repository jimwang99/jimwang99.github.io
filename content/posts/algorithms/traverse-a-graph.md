---
title: "Traverse a graph"
date: 2024-06-08
---

1. Mark all nodes as not visited.
2. Create an empty `ready` bucket to hold nodes that has been visited itself but not its neighbors yet.
3. Find a starting `node`, mark it as visited and put into the `ready` bucket.
4. Get an `node` from the `ready` bucket and look at its directly connected neighbors. Skip those that are visited already, mark the rest as `visited` and put them into the `ready` bucket.
5. Repeat 4 until `ready` is empty.

Depends on how you operate `ready` bucket, you can achieve BFS (breadth first search) or DFS (depth first search).
- BFS: use `ready` as a queue, operations are queue and dequeue, aka FIFO
- DFS: use `ready` as a stack, operations are push and pop, aka FILO

## Path finding

If you also need to trace the path, what you can do is:
1. Setup a `dict` for `path` whose key and value are both nodes, while key is current node, value is previous node.
2. Setup a `dict` for `cost` whose key is node and value is the minimum cost to get to that node.
3. For each step of the traverse,
    1. Instead of looking at `visited`, you need to calculate each node's cost. If next node's cost is lower than recorded, replace the code and put next node into `ready` even though they are visited already.
    2. You need to update the `path` with current step's next nodes, if they are not visited, or visited but with higher cost.
4. When destination node is reached, but `ready` is still not empty, you need to continue, because future path could have lower cost.
5. When a path is found to a particular destination node, you can use this `path` dictionary to walk back the history step by step.
