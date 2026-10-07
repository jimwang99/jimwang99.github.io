---
title: "Case Study Clock Divider with Synchronous Reset"
date: 2018-10-25
aliases:
  - "/blog/design/2018-10-25-case-study-clock-divider-with-sync-reset/"
---

When using a counter to divide a clock, don’t reset the counter, especially when you are using synchronous reset. It will make the clock quiet while reset. And if it’s used along with sync reset, then those flip-flop won’t be reset at all.

But if without reset, the counter will be “X” in simulation.

```
logic [1:0] cntr;

`ifndef SYNTHESIS
initial begin
    cntr = 2'b00;
end
`endif

always_ff @ (posedge clk) begin
	cntr <= cntr + 1;
end
```
