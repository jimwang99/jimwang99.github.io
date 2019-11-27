////////////////////////////////////////////////////////////
// top.cpp

#include <iostream>
#include <sstream>

#include <systemc.h>
#include "fir.h"
#include "tb.h"

SC_MODULE ( top ) {
  // sub-module instances
  tb  *tb_u;
  fir *fir_u;
  
  // signals
  sc_clock                    clk;
  sc_signal< bool >           rstn;
  sc_signal< sc_int<32> >     in, out;
  sc_signal< bool >           in_vld, in_rdy, out_vld, out_rdy;
  
  // construction
  SC_CTOR (top)
    : clk ("clk", 10, SC_NS)        // 10 is the clock period, SC_NS is the time unit
  {
    tb_u = new tb("tb_u");
    tb_u->clk(clk);
    tb_u->rstn(rstn);
    tb_u->in(in);
    tb_u->in_vld(in_vld);
    tb_u->in_rdy(in_rdy);
    tb_u->out(out);
    tb_u->out_vld(out_vld);
    tb_u->out_rdy(out_rdy);

    fir_u = new fir("fir_u");
    fir_u->clk(clk);
    fir_u->rstn(rstn);
    fir_u->in(in);
    fir_u->in_vld(in_vld);
    fir_u->in_rdy(in_rdy);
    fir_u->out(out);
    fir_u->out_vld(out_vld);
    fir_u->out_rdy(out_rdy);
  }
  
  // destructor
  ~top() {
    delete tb_u;
    delete fir_u;
  }
};

////////////////////////////////////////////////////////////////

// instantiate top level
top *top_u = NULL;

int sc_main (int argc, char* argv[]) {
  top_u = new top("top_u");

  sc_trace_file *tf;
  tf = sc_create_vcd_trace_file("trace");
  sc_trace(tf, top_u->clk, "clk");
  sc_trace(tf, top_u->rstn, "rstn");
  sc_trace(tf, top_u->in, "in");
  sc_trace(tf, top_u->in_vld, "in_vld");
  sc_trace(tf, top_u->in_rdy, "in_rdy");
  sc_trace(tf, top_u->out, "out");
  sc_trace(tf, top_u->out_vld, "out_vld");
  sc_trace(tf, top_u->out_rdy, "out_rdy");
  for (int i=0; i<N_TAP; i++) {
    std::ostringstream name;
    name << "tap_vld_" << i;
    sc_trace(tf, top_u->fir_u->tap_vld[i], name.str());
  }

  sc_start();
  sc_close_vcd_trace_file(tf);
  return 0;
}

