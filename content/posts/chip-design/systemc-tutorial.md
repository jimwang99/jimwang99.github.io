---
title: "SystemC Tutorial"
date: 2018-12-07
aliases:
  - "/blog/note/2018-12-07-systemc-tutorial/"
  - "/blog/tutorial/2018-12-07-systemc-tutorial/"
  - "/posts/notes/systemc-tutorial/"
---

```
// Some simple example

#include <systemc.h>

SC_MODULE (seq_and2 ) { // sequential AND2
    sc_in< sc_uint<8> >		a;
    sc_in< sc_unit<8> >		b;
    sc_out< sc_uint<8> >	f;
    sc_in<bool>				clk;

    void func() {
        f.write( a.read() & b.read() );
    }

    SC_CTOR ( seq_and2 ) {
        SC_CTHREAD(func);
        sensitive << clk.neg();
    }
}
```

## Port & signal

* Port
  + `sc_in` & `sc_out`
  + `.read()` & `.write()` functions
* Signal
  + `sc_signal`

## Threads

* `SC_METHOD()`
  + Just like `always_comb` in Verilog, but you have to list the sensitive list
* `SC_THREAD()`
  + Not commonly used
  + Behavior like `initial` in Verilog
* `SC_CTHREAD(function name, clock sensitive)`
  + Most commonly used
  + Only sensitive to clock edge, just like `always_ff` in Verilog
  + Not limited to one cycle
* `sensitive` keyword to define the sensitive list

## Datatypes

* Integers

  + `sc_uint<N>` & `sc_int<N>`
* `.to_int()` convert internal datatypes to integer for print

## Reset

* `reset_signal_is(rst signal name, true or false for high or low active reset);` right after the `SC_CTHREAD()` definition

## Simulation

* Start simulation in `sc_main` (the same with `main` in normal CPP program) with `sc_start()`
  + With argument, `sc_start(N)` runs till time N
* Stop simulation in `sc_stop` anywhere you like, normally in testbench
* Time stamps

```
sc_time ts_start_time;
ts_start_time = sc_time_stamp();
```

* Clock period

```
sc_clock *clk_p = DCAST<sc_clock*>(clk.get_interface()); // clk is the clock signal
sc_time clock_period;
clock_period = clk_p->period();
```

## Some more examples
