---
title: "Register-based SRAM Read Circuit RTL Example using generate"
date: 2017-01-18
aliases:
  - "/blog/design/2017-01-18-generate-example/"
---

Some parameterized example RTL code for register-based SRAM read circuit using “generate” feature

```
parameter        d = 32;         // FIFO depth
parameter        w = 64;         // FIFO data bit-width

logic   [w-1:0]  mem [d-1:0];    // FIFO memory array
logic   [d-1:0]  rwl;            // 1-hot read word line

// read circuit using "generate"
wire    [w-1:0] word_or;
genvar width, depth;
generate
    for (width = 0; width < w; width++) begin: rbit
        wire [d-1:0] bit_or;
        for (depth = 0; depth < d; depth++) begin: rmux
            assign bit_or[depth] = mem[depth][width] & rwl[depth];
        end
        assign word_or[width] = |bit_or;
    end
endgenerate

reg     [w-1:0] idout;
always @ (negedge CKB) begin
    idout <= word_or;
end
```
