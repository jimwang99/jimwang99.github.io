---
title: "Python `heapq` Priority queue (heap queue)"
date: 2024-06-15
---

## Attributes
- "Min heap", where index 0 is the smallest item

## APIs
- `heapq.heapify(iterable) -> None`: Create a heap queue **in-place**
- `heapq.heappush(heap, item) -> None`: Add a new item
- `heapq.heappop(heap) -> T`: Pop the smallest item
- `heapq.heappushpop(heap, item) -> T`: Push then pop the smallest
- `heapq.heapreplace(heap, item) -> T`: Pop then push
