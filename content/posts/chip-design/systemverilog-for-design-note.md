---
title: "SystemVerilog for Design Note"
date: 2017-01-10
aliases:
  - "/blog/note/2017-01-10-systemverilog-for-design-note/"
  - "/blog/tutorial/2017-01-10-systemverilog-for-design-note/"
  - "/posts/notes/systemverilog-for-design-note/"
---

> This is my reading note of book “SystemVerilog for Design (2nd edition)". As a non-full-time RTL designer, it has opened my mind. But still, I'm sad about the antient tool that we are using to design hardware.

# Chapter 2: SystemVerilog Declaration Spaces

## Package

* Verilog shortage: no global declaration
* `package ... endpackage`
  + share user-defined type definitions across multiple modules
  + independent of modules
  + parameters cannot be redefined
    - in package, parameter is similar to localparam, cos in module localparam cannot be directly redefined while instantiation
* referencing
  + `::` the scope resolution operator
    - `package_name::package_member`
  + use `import` to import package into current space
    - `import package_name::package_member`
      * TIPS: importing an enumerated type definition will not import the labels automatically
    - `import package_name::*`
      * what is used will be imported
  + `$unit` declaration space
* TIPS: synthesis guide
  + tasks and functions must be `automatic`
    - storage for automatic task/function is allocated each time it's called
  + cannot use `static` variables, which are supposed to be shared by all instances

## $unit: compilation-unit declarations

* declaration space **outside** of package/module/interface/program
  + BUT it's **not** global
* if put variables and nets in $unit
  + source code order can affect the usage of a declaration external to the module
* each **compilation** has one $unit
  + single-file compilation
  + multiple-file compilation: source order is tricky
* TIPS: coding guide
  + DONOT make any declarations in $unit space, only import packages into $unit
  + ILLEGAL to import the same package more than once into the same $unit
  + NOTE: donot work for global variables, static task/function

```
// filename: def.pkg
`ifdef DEF_PKG
`define DEF_PKG

package def;
// ...
endpackage
`endif
```

```
// in every design or testbench file that need package "def"
`include "def.pkg"
```

* identifier search rules

1. local
2. package
   * named first
   * `*` wildcard second
3. `$unit`
4. design hierarchy

* TIPS: synthesis guide
  + use packages instead of $unit
  + external task/function must be automatic

## Named/unnamed statement blocks

* local variables in named blocks can be accessed hierarchically
* local variables in unnamed blocks (added in SV) has no hierarchical path
  + protecting from external, cross-module referencing

## Timing units and precision

* problem with Verilog's timescale directive: file order dependent
* SystemVerilog improvements
  + time value with time units: 5ns, 3.2ps
    - NOTE: there is no space between number and unit
* scope-level time units and precision: timeunit & timeprecision keywords
  + must be immediately after module/interface/program declaration
* search order

1. local
2. parent module/interface
3. `timescale` in effect while compilation
4. defined in $unit
5. simulator default

# Chapter 3: SystemVerilog Literal Values and Built-in Data Types

## Literal value enhancement

* Verilog tricks to fill vector with all ones
  + `data = ~0; // one's complement`
  + `data = -1; // two's complement`
* SystemVerilog: apostrophe(tick) ( ' ) (Note: not back-tick ( ` ))
  + `data = '1; // all 1's`
  + `data = 'z; // all z's`

## DEFINE enhancement

* String

```
// Verilog
`define print(v) $display("variable v = %h", v)
`print(data); // = $display("variable v = %h", data);

// SystemVerilog
`define print(v) $display(`"varaible v = %h`", v)
`print(data);  // = $display("variable data = %h", data);

// SystemVerilog: escape with double `
`define print(v) $display(`"varaible `\`"v`\`" = %h`", v)
`print(data);  // = $display("varaible \"data\" = %h", data);
```

* Construct identifier names: double back-tick w/o space will separate names that will allow 2 or more names to be replaced and form a new name.

```
`define MY_NET(index) bit my_net``index``_bit;
`MY_NET(00)  // = bit my_net00_bit;
`MY_NET(15)  // = bit my_net15_bit;
```

## Variables

* Type
  + Net: “wire” keyword, only 4-state
  + Variable: “var” keyword, most of the time it can be omitted
* Data type: value system
  + 2-state: “bit” keyword
  + 4-state: “logic” keyword (to replace “reg” keyword)
* Explicit & implicit (shit-hole of SystemVerilog)

```
// 4-state 8-bit varaible
logic [7:0] busA;
// to be explicitly
var logic [7:0] busA;

// 2-state 32-bit variable
bit [31:0] busB;
// to be explicitly
var bit[31:0] busB;

// 4-state 8-bit net
wire [7:0] busC;
// to be explicitly
wire logic [7:0] busC;

wire reg [31:0] busD; // ILLEGAL
```

* Signed vs. Unsigned
  + Concatenation automatic create `unsigned` result
  + `logic` are unsigned by default
  + `int` are signed by default
  + syntax: `<type> <signed/unsigned> <bit width> <name>;`
* TIPS: synthesis guide
  + Because 2-state data types begins simulation with default 0 instead of X, if they are used in RTL may cause RTL behavior mismatch gate-level netlist. So they are mostly used in verification
  + Converting from 4-state to 2-state, X and Z are mapped to 0
* High level data type:
  + 2-state data type: used for abstract model or DPI (Direct Programming Interface) to work with C/C++ model
    - `byte`: 8-bit
    - `shortint`: 16-bit
    - `int`: 32-bit
    - `longint`: 64-bit
  + `void`: no storage
  + `shortreal`: 32-bit single-precision = float in C, while `real` = double in C
  + `classes`: not covered in this book
* NOTE: Most signals can be declared as `logic` in RTL
  + `logic` for single-driver
  + `wire` for multi-driver logic (wand/wor)
* Value drivers
  + Any number of `initial` or `always` blocks
    - NOTE: it's only for back-compatable with Verilog which is not really circuit behavior
  + Single `always_comb/always_ff/always_latch` block
  + Single `assign` statement
  + Single `module/primitive output/inout`
* Type casting
  + Static casting (synthesizable)
    - Size casting: `<size>'(<expression>)`
      * ex. `16'(2) // 16-bit wide`
    - Sign casting: `<sign>'(<expression>)`
      * ex. `signed'({a, b}) // unsigned concatenation result to signed`
    - Dynamic casting (has error check)
      * ex. `cast(dest_var, source_exp);`
* Varaible initialization
  + SystemVerilog in-line initialization is before time zero and does not cause a simulation event
  + Testbench should initialize varaibles to their inactive state
* Static and automatic variables
  + `static` vs `automatic`
    - Storage
    - Automatic variables can be used for re-entrant tasks and recursive functions.
  + Module level, all varaibles are static
  + `begin … end` and `fork … join` blocks, tasks and functions, all storage defaults to static
  + Automatic tasks and functions have all automatic storages
  + Initialization
    - Static variables are only initialized once
    - Automatic variables are initialized each call

## Constants

* Verilog
  + `parameter`: can be redefined when instantiation
  + `specparam`: can be redefined from SDF
  + `localparam`: elaboration-time constant, cannot be directly redefined
* SystemVerilog: C-like const keyword
  + `const int N = 5;`

# Chapter 4: SystemVerilog User-Defined and Enumerated

## `typedef` keyword

Ex. `typedef int unsigned uint;`

* Local & shared
  + Local: within a module/interface, scope is limited locally
  + Shared: use package and import; or import to $unit
* Naming convention
  + End with `_t`, the same as C

## Enumerated types

* Verilog vs SystemVerilog
  + Verilog: use constants to represent enumerated types
    - But nothing would limit the value of enum varaibles, will cause error
    - Need `fullcase` directive
  + SystemVerilog: enum
    - Self-doc, easier to debug
    - Value check
    - All tools deal with enum the same way
* `import package_name::*`
  + Import the enum type will not automatically import labels
* Define list of labels

```
enum {RESET, WAIT[2], WORK[3: 5], CLEAN[3: 0]} state;
// RESET, WAIT0, WAIT1, WAIT2, WORK3, WORK4, WORK5, CLEAN3, CLEAN2, CLEAN1, CLEAN0 ("[" and "]" are discarded)
```

* Label
  + Must be unique in naming scope, so it's required to add prefix to the label
* Values
  + Default to be “int” and start from 0
  + Can be specified explicitly
  + - One-hot, one-code, Johnson-count, Gray-code, etc.
  + Must be unique
* Types
  + Default to be `int`
  + Can be specified explicitly
    - `Bit, logic`
    - Ex. `enum logic [2:0] {WAIT = 3'b001, LOAD = 3'b010, READY = 3'b100} state;`
  + 4-state could be Z or X
    - But the next lable after Z or X should be given value explicitly (otherwise tools don't know how to increase value automatically)
* Typed enumerated type vs. anonymous enumerated type
  + `typedef enum {WAIT, LOAD, READY} state_t;`
* Type check
  + Most variables are loosely typed
    - Any value can be assigned to a variable, just has to be cast implicitly
  + Enum is strongly typed

```
typedef enum {
    WAIT, LOAD, READY
} state_t;
state_t state, next_state; // actually is stored as int
int foo;
state = next_state;
foo = state + 1;
state = foo + 1; // ILLEGAL
state = state + 1; // ILLEGAL
state++; // ILLEGAL
next_state += state; // ILLEGAL
```

* Casting
  + `next_state = state_t'(state++); // legal: synthesizable, no value check, maybe out-of-range`
  + `$case(next_state, state+ 1); // legal: not synthesizable, with value check, slower in simulation`
* System methods (similar to C++ syntax)
  + `${enum_varaible_name}.first/last/next(<N>)/prev(<N>)/num/name`
    - `*.name` return a string
    - If current value is not a valid value defined, next/prev return the first element
    - `*.next/prev` will wrap around

# Chapter 5: SystemVerilog Arrays, Structures and Unions

## Struct

* Struct vs. array
  + Array: collection of elements with the same type and size; reference by index
  + Struct: collection of varaibles/constants can be diff types and sizes; reference by name
* Struct vs. interface
  + Struct usually for variables, can be defined inside of interface
  + Inferface are net type, cannot be defined inside of struct
* Use `typedef` to give a name to `struct` and reuse it
* Assigning value to structures
  + New “`{ }` token
    - `IW = '{100, 5, 8'hFF, 0};`
  + By name
    - `IW.a = 100; IW.b = 5;`
  + Combine these two
    - `IW = '{address:0, opcode:8'hFF, a:100, b:5}`
  + Default value
    - `IW = '{default:0}; // all members by default is 0`
    - `IW = '{default:0, a:100}; // all members is 0 by default, except a is 100`
* Packed vs. unpacked
  + By default, it's upacked
  + Use `packed` keyword to defined packed structure
    - All members are stored as contiguous bits
    - Then members can be reference as vector with bit/range position.
    - Can only contain integral values (not real or shortreal)
    - `signed` or `unsigned`
    - * Treat the **whole vector** of packed structure as singed/unsinged
      * Each member can still be signed/unsigned independently
* Passing struct through module/interface ports and task/function argument
  + NOTE: when passing **unpacked** struct, both sides should have exactly the same type, while anonymous struct declared in 2 diff modules, even if with the same names/members, are not the same type of struct
* Synthesis guide
  + Both unpacked and packed struct are synthesizable

## Union

* Union is a single storage element that can have multiple representation
  + Ex. One 8-bit data can either be signed or unsigned with diff configuration
* The same with struct, use `typedef` to reuse
* Unpacked union
  + NOT synthesizable
* Tagged union
  + `tagged` keyword
  + Check whether the union is used in a consistent way
    - Write to one member, then read from another is dangerous
* Packed union
  + Synthesizable
  + All memebers have the same size
    - Allow write to one format then read from another

```
// example: represent packed struct in array of bytes
Union packed {
    data_package_t packet; // packed structure
    logic[7: 0][7: 0] **byte**; // packed array
} datareg;
```

## Array

* Unpacked arrays
  + Verilog limitation: restrict access to arrays to just one element of the array at at time
    - SystemVerilog refer Verilog style array as unpacked arrays
    - Elements are stored independently, just grouped under the same array name
  + SystemVerilog improvement: reference the entire/slice of an array
  + - A slice is one or more contiguously numbered elements within one dimension of an array
    - Assignment of this type: left-hand & right-hand should have identical layout and types
  + Simplified declarations
    - `logic [31:0] data [1024]; // logic [31:0] data [0:1023]`
* Packed arrays
  + Vector = packed arrays
    - Any vector operation can be performed on packed arrays
  + Only bit-wise types can be packed arrays
    - Bit/logic/reg or net types
* Unpacked vs packed arrays
  + Unpacked: model memories & abstract types
  + Packed: vectors with sub-fields
* Assignment
  + Packed array is assigned the same as vector
    - Concatenated operator, repicate operation
  + Unpacked array
    - `{ }` and `{n{ }}` keyword
  + Default value
    - `int a [0:7][0:1023] = '{default: 8'h55};`
  + Copy
    - Unpacked array copy only can between the same array with the same number of dimensions and element size, and are of the same types
* Indexing

```
    logic [3:0][7:0] mixed_array [0:7][0:7][0:7];
//  ______|-4-||-5-|_____________|-1-||-2-||-3-| <- order
```

* Typedef with array
* Array of struct and union
* Array in struct and union
* Passing
  + Any number of dimensions can be passed through ports or task/function arguments
* `foreach` keyword to iterate array elements

```
int sum[1: 8][1: 3];
foreach(sum[i, j])
  sum[i][j] = i + j;
```

* Array query system function
  + `$dimensions(array_name)`
    - Number of dimension
  + `$left/right/low/high(array_name, dimension)`
    - Boundary of dimension
  + `$size(array_name, dimension)`
    - Size of dimension
  + `$increment(array_name, dimension)`
    - 1 or -1
  + `$bits(expression)`
    - Size-of “expression”, expression could be any type of data or slices
  + All these system functions are synthesizable
* Dynamic types are covered in verification that's NOT synthesizable
  + Dynamic arrays
  + Associative arrays
  + Sparse arrays
  + Strings (character arrays)

# Chapter 6: SystemVerilog Procedural Blocks, Tasks and Functions

# `always` procedual block

* Verilog limitation
  + `always` could be combinational or latched or sequential
  + EDA tool must infer design intent from cotent, which might differ from the real intent
* SystemVerilog improvement
  + New keywords: `always_comb` & `always_latch` & `always_ff`
* `always_comb` (adv. vs. `always @ *`)
  + NO need to specify sensitivity list, auto infer
    - Eliminate the risk of incorrect sensitivity list
    - Includes the signals read within any functions called from the block
      * Some functions may not list all the signals their read as argument
  + Assignment only happens in current block, to avoid multi-driven problem (which is legal in Verilog syntax)
  + Clear design intent
    - Tool will issue warning if content doesn’t represent combinational logic
  + Automatic evaluation at time zero, after initial/always activation
    - Important for some special case to get correct init value, instead of default value. The book here gave a very interesting corner case of a state machine, at page 145.
* Extra good practice tip about break-down code into managable pieces: multi always block vs. functions
  + Multi-always: many signals propagate through several procedural blocks
  + Function is better (maybe even better if use unit test)
* `always_latch`
  + Same sensitivity list inferring with `always_comb`
* `always_ff`
  + Tool will verify if content represent sequential logic (synthesize requirement)
    - Every signal in the sensitivity list must be qualified with `posedge` or `negedge`
    - Event control must be from sensitivity list

# `` task`/ ``function`

* Inferred `begin … end`
* `return`
  + Return variable explicitly, instead of using function name variable
  + End function before going through to the end of code
* `void` type function (C-style)
  + No return function
  + But can have `output`
* For synthesis, use `function void` instead of `task`
* Argument
  + Named argument when using
    - Ex. divide(.denominator(b), numerator(a));
  + `input/output/inout` argument
    - By default, `input`
  + No argument
    - To break-down code into managable pieces
  + Default value
    - Missing argument when using
  + Arrays, structures and unions as argument
    - Use `typedef`
  + **Reference** instead of copy
    - Normally, inputs are copied when called, outputs are also copied when finished
    - Verilog still can use `reference` with hardcoded hierarchical name of signals. But it’s very poor in reusablility.
    - New `ref` keyword (instead of input/output/inout)
* Only automatic task/function can have `ref` arguments
  + New `const ref` keyword to define read-only reference arguments
  + (used in task) Allows sensitivity to changes
* Can be used to trigger event
* Can be used to read/write value in real-time (if have event/timing control)
  + Restriction with `output/inout/ref` argument
    - Not from an event expression
    - Not from a continuous assignment
    - Not from outside procedural statement
* Named task/function: better readability
  + `endtask : <task_name>`
  + `endfunction : <function_name>`
* Empty task/function as place holder

# Chapter 7 SystemVerilog Procedural Statements

## New opeators

* `++` & `--` operators
  + `i++` is post-increment, while `++i` is pre-increment
    - i = 10; j = i++; // j = 10, i = 11
    - i = 10; j = ++i; // j = 11, i = 11
  + Behave as blocking assignments, so avoid using them where non-blocking is required
* Combination of operation with assignment
  + `+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`, `<<<=`, `>>>=`
    - Where `<<<` and `>>>` are arithmetic shifting while treating target as signed number, and do sign expansion when needed
* Wildcard equality operator `==?` and `!=?`
  + Allow don’t care bits: X, Z or ?
  + While original `==` and `!=` will return unknown (bit x) if either operand is X or Z
  + Notice: expand vector to same size before comparison. This can be dangerous.
  + Synthesizable: right hand operand must be constant expressions
* Membership operator: `inside`
  + `if ( a inside {3'b001, 3'b010, 3'b100} )` = `if ( (a==3'b001) || (a==3'b010) || (a==3'b100) )`
  + Right-hand value could be array
  + Use X or Z to represent don’t care
  + Can be used in case statement

```
case (instruction) inside
4'b0???: ...
4'b1000, 4'b1100: ...
default: ...
endcase
```

* Synthesizable: right hand operand must be constant expressions

## Operand enhancement

* Type casting
  + In Verilog, there is no explicit type casting method
  + `type'(expression)`
* Size casting
  + `size'(expression)`
* Sign casting
  + `signed'(expression)`
  + `unsinged'(expression)`

### Enhanced `for` loops

* Local variables within `for` loop
  + Ex. `for (int i=0; I <=15; i++)`
  + Prevent interference between for loops
  + They are automatic type
  + Doesn't exist outside `for` loop
    - If want to be used after for loop, must be declared outside
* Multi `for` loop
  + Ex. `for (int i=1, byte j=0; i*j < 128; i++, j+=3)`
* Named procedual blocks, to access local variables
  + But variable within `for` loop cannot be accessed hierarchically, must be declared outside `for` loop inside named procedual block

### `do … while` loops

* A while loop might not execute at all
* Synthesizable: statically determine how many times a loop will execute

### `foreach` loops

* To interate elements of single- and multi-dimentional arrays

### `break`, `continue`, `return`

* C-style jump statements, to replace old `disable` statement
* More intuitive and concise

### Enhanced block names

* Named `end` to paire with named `begin`
* For readability

### Statement lables

* For readability
* :
* Illegal to have both label and name

### Enhanced `case`

* `unique case`
  + = parallel case + full case
  + Runtime check
    - Pros: actual value will be checked, no false alarm
    - Cons: dependent on the thoroughneess of the verification tests
  + Clear design intent
* `priority case`
  + = full case
  + Runtime check
  + Notice: if it's not full case, latches can be inferred

### Enhanced `if ... else`

* `unique if ... else`
  + The order of the decisions is not important
  + Cannot have overlapping conditions (similar to parallel case)
* `priority if ... else`
  + Clearly defined design intent

# Chapter 8: Modeling Finite State Machines with SystemVerilog

This chapter gives some simple example of FSM code featuring SystemVerilog new keywords, such as `enum`, `always_comb`, `always_ff`, `unique case`.

## Modeling FSM with `enum`

* 3 blocks to model an FSM
  + Incrementing state
  + Determine the next state
  + Set output
* Using `enum` without explicitly specified value
  + Cause mismatch in value between RTL and gate-level netlist
  + Cause difficulty with assertion to work for both RTL and gate-level netlist
  + So, DO specify value for `enum`
    - Can use `one-hot`, `one-cold`, `Gray code`, etc.
  + Synthesis compiler may try to optimize these explicitly defined values
* Reversed case statement
  + The following example is seemly complicated (overkill), but actually have 2 advantages
    - Eliminate the possibility to define wrong one-hot/cold state value
    - Easier for future extension
* Unique and parallel case (refer to Chapter 7)

```
module traffic_light (
output logic    green_light,
                yellow_light,
                red_light,
input           sensor,
input [15:0]    green_downcnt,
                yellow_downcnt,
input           clk, rstb
);

// index of RED/GREEN/YELLOW bit in the state register
enum {  R_BIT = 0,
        G_BIT = 1,
        Y_BIT = 2
} state_bit;

// state register
enum logic [2:0] {  RED     = 3'b001 << R_BIT,
                    GREEN   = 3'b001 << G_BIT,
                    YELLOW  = 3'b001 << Y_BIT
} state, next_state;

always_ff @ (posedge clk, negedge rstb) begin : step_forward
if (!rstb) begin
    state <= RED;
end else begin
    state <= next_state;
end
end : step_forward

always_comb begin : set_next_state
unique case (1'b1)      // reversed case statement
state[R_BIT]: begin
    if (sensor) begin
        next_state = GREEN;
    end
end
state[G_BIT]: begin
    if (green_downcnt == 0) begin
        next_state = YELLOW;
    end
end
state[Y_BIT]: begin
    if (yellow_downcnt == 0) begin
        next_state = RED;
    end
end
endcase
end : set_next_state

always_comb begin : set_output
unique case (1'b1)
state[R_BIT]: begin
    red_light       = 1'b1;
    green_light     = 1'b0;
    yellow_light    = 1'b0;
end
state[G_BIT]: begin
    red_light       = 1'b0;
    green_light     = 1'b1;
    yellow_light    = 1'b0;
end
state[Y_BIT]: begin
    red_light       = 1'b0;
    green_light     = 1'b0;
    yellow_light    = 1'b1;
end
endcase
end : set_output

endmodule
```

* Specify unused state values
  + In Verilog, we used to have `default: next_state = 3’bxxx;` to tell synthesis compiler that the default case is an unused value.
  + In SystemVerilog, we can use either `unique case` or `parallel case` to state that this is a full case statement.
    - Better, because of runtime check
* Always assign enumerated type variable with a label from its enumerated list, instead of a value or an expression, although sometimes they are legal after type casting.
  2-state type in FSM
* The idea is dangerous, because 2-state type variables initialize to logic 0 instead of logic X before applying reset. So it’s not how real circuit behave.

# Chapter 9: SystemVerilog Design Hierarchy

## Module prototypes: extern

* Similar to C-Style \*.h head file
  + More convenient: no duplicate port definition needed
  + Can be defined in one file, then ``include` to other files
* No necessarily

## Named ending statements

* `endmodule : <module_name>`
* Also apply for others
  + `package … endpackage`
  + `interface … endinterface`
  + `task … endtask`
  + `function … endfunction`
  + `begin … end`

## Nested module

* Verilog limitations
  + Module names are global
    - No restriction to be accessed
    - Cause name conflicts
* SystemVerilog improvements: nested module
  + Modules that are declared within modules
  + Not visible outside the scope
    - Can be instantianted by the parent module and the modules below
  + Can also access variable/constant/task/function in $unit
* However, controversy with common moduel style that every module has it's own file
  + This kind of style is good for large designs; and good for utilizing VCS
  + Use ``include` to keep the same style

## Simplify module instance

* Named port connection is good for documenting the design intent, but too verbose
* `.name` connection
  + `.port_name(net_name)` -> `.port_name` if port\_name equals to net\_name
* `.*` connection
  + Matches all cases that port\_name equals to net\_name
* These simplification also apply to function/task

## Net aliasing

* `alias` statement
  + `alias clk = clock = ck; // can be multiple aliases together`
  + Only applies for net types, with the same type, and the same size
    - `wire [31:0] n1; wire [3:0][7:0] n2; alias n2 = n1;`
  + By default, infer `wire` if left-hand side names are not defined explicitly
  + Alias vs. assign
    - Assign is copied from right to left whenever right is changing
    - Alias is copied to all whenever either one is changing
* Alias with `.name` and `.*` is powerful
  + On top-level module, even if the local net\_name is different from the port\_name of its instances, we can still use `alias` to make them the same and use `.*`

## Passing values through module ports

* SystemVerilog removes most port restrictions, except the following two
  + Varaible can have only one single source
  + Unpacked types must be identical
    - Declared using the same `typedef` definition

## Reference ports `ref`

* Reference the hierarchical source directly
  + Warning: one variable can be written from multiple source
* NOT synthesizable

## Enhanced port declaration

* Verilog-2001
  + Port list =
  + By default, type is wire
* SystemVerilog
  + The first port's direction could be optional, by default is `inout`
  + Later on, direction could be optional, by default is the same with previous one

## Parameterized types

* Net, variable of a module could be parameterized

```
module adder #(parameter type DATA_TYPE = shortint) (
input   DATA_TYPE   a, b,   // redefinable
output  DATA_TYPE   sum,    // redefinable
        logic       carry   // direction is `output`, the same with sum
);
// ...
endmodule : adder

module top ();

adder #(.DATA_TYPE(int)) int_adder( /* ... */ );
adder #(.DATA_TYPE(int unsigned)) uint_adder( /* ... */ );

endmodule : top
```

# Chapter 10: SystemVerilog Interfaces

## Concepts

* How Verilog models connects between blocks
  + Directly on physical connections in actual hardware level
  + Disadvantage
    - Port connection must be duplicated in several modules
    - Communication protocols must be duplicated also
    - Duplication leads to mistakes that is hard to debug
    - Changes in spec involves lots of modification
    - Details of connection must be defined in early design cycle (not good for top-down design paradigm)
* `interface` keyword
  + Several signals grouped together to represent as a single port
  + And modules use interface as a single port
* Interface contents
  + Discrete signals and port
  + Communication protocol, defined as task/function
  + Protocol checker and verification routines
* Interface vs. module
  + Interface doesn't have hierarchy
  + Interface can be used as module port
  + Interface can contain `modport` which can represent different usage env.
    How to declare an interface?
* Similar to module, with `interface … endinterface` keyword
  + Can have ports: external signals to interface
  + Can use `.name` and `.*` for connection abbreviation
* Declaration order
  + Just as module, no order needed
* Global vs. local
  + Just as module, global definition can be used anywhere, local definition can be used in certain scope (for IP)
    How to use interface?
* As module ports
* Explicitly named vs. generic
  + Explicitly named interface port can only connect to an interface with the same name
* `module <module_name> ( <interface_name> <port_name);`
  + Generic interface can connec to any interface port
* `module <module_name> ( interface <port_name);`
  + Both are synthesizable
* Instantiate and connect interface
  + ILLEGAL leave an interface port unconnected
  + `.name` and `.*` can be used to connect interface
* Referencing interface's signals
  + Use dot: <port\_name>.<internal\_signal\_name>

## Modport

* Differnet views of interface
  + Ex. a interrupt sub-signal could be input to CPU, but output to peripheral modules
* `modport` means module port
  + Contains only direction and signal names, not vector size or types
* Selecting which modport to use
  + In module instance
    - `<module_name> <instance_name> ( .<port_name>(<interface_instance_name>.<modport_name>) );`
  + In module delcaration (better because of consistency)
    - `module <module_name> ( <interface_name>.<modport_name> <port_name> );`
  + NOT use both methods above
  + If no modport is specified
    - all nets have `inout` direction, by default
    - all variables have `ref` type, by default
  + Synthesizable for both
    - Some synthesis tool will convert (expand) interface modport to normal ports automatically
* To define different sets of connections
  + Hide certain signals in different modport: incompleleted signal list while defining one modport
  + Internal signals that are not accessable from any modport
    - Might be used for protocol checkers or other functionality
* Example

```
interface cpu_bus (input logic clk, rstb, test_en);
wire    [15:0]  data;
wire    [15:0]  addr;
logic   [ 7:0]  slave_cmd;
logic           slave_req;
logic           bus_grant;
logic           bus_req;
logic           slave_ready;
logic           data_ready;
logic           mem_ren;
logic           mem_wen;

modport master (
    inout   data,
    output  addr,
    output  slave_cmd,
    output  slave_req,
    output  bus_grant,
    output  mem_ren,
    output  mem_wen,
    input   bus_req,
    input   slave_ready,
    input   data_ready,
    input   clk,
    input   rstb,
    input   test_en
);

modport slave (
    inout   data,
    inout   addr,
    output  mem_ren,
    output  mem_wen,
    output  bus_req,
    output  slave_ready,
    input   slave_cmd,
    input   slave_req,
    input   bus_grant,
    input   data_ready,
    input   clk,
    input   rstb,
    input   test_en
);

modport mem (
    inout   data,
    output  data_ready,
    input   addr,
    input   mem_ren,
    inout   mem_wen
);

endinterface

module top ();

// instance of an interface
cpu_bus     bus ( .* );

processor   proc1 ( .bus(bus.master), .* );
slave1      slave1 ( .bus(bus.slave), .* );
slave2      slave2 ( .bus(bus.slave), .* );
dual_port_ram mem ( .bus(bus.mem), .data_b(next_instruction), .* );

// test generator need to access everything in inside `bus`
test_generator test_gen ( .bus(bus), .* );

endmodule
```

## Task/function in interface

* Implement the details of communication protocol
  + Written once, shared by all modules connected using the same interface
* Values are passed to interface methods as input argument
* `import` when defining `modport`
  + Either use the name only, or the full prototype
    - Latter is useful when task is defined somewhere else
* Access using <interface\_port\_name>.<method\_name>
* Task/function must be automatic to be synthesizable
* Exporting task/function are not synthesizable
  + Define task/function in module, then export it to interface, and use it in other modules
  + Export from module's all instances
    - `extern forkjoin`
    - Useful when you want to broadcast signals, such ask counting one module's instances
      Procedural blocks in interface
* Used for verfication and protocol checker
* NOT synthesizable
  Reconfigurable interface
* Parameterized interface
  + The same as modules
* Generate statement
  + The same as modules

# Chapter 11: A Complete Design Modeled with SystemVerilog

Interesting part: how to implement a latch-based LUT with SystemVerilog interface

```
// implement LUT (basically an SRAM/Register File with interface in SV)
interface if_look_up_table;

parameter int ADDR_SIZE = 8;
parameter int ADDR_RANGE = 1 << ADDR_SIZE;
parameter type DATA_TYPE = logic;  // the bit-cell's type could be reconfigurable

DATA_TYPE mem [0:ADDR_RANGE-1];

// function to perform write operation
function void write (
    input [ADDR_SIZE-1:0]   addr,
    input DATA_TYPE                 data
);
    mem[addr] = data;
endfunction : write

// function to perform read operation
function void read (
    input [ADDR_SIZE-1:0]   addr
);
    return (mem[addr]);
endfunction

endinterface

// Then in circuit where instantiate this LUT

typedef struct packed {
    logic [`NUM_TX_PORT-1:0] FWD;
    logic [11:0] VPI;
} cell_cfg_t;

if_look_up_table #(.ADDR_SIZE(8), .DATA_TYPE(cell_cfg_t)) lut();

always_latch begin
    if (lut_wen) begin
        lut.write(lut_waddr, lut_wdata);
    end
end

always_comb begin
    if (lut_ren) begin
        lut_rdata = lut.read(lut_raddr);
    end else begin
        lut_rdata = 'hz;
    end
end
```
