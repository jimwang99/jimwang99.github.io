////////////////////////////////////////////////////////////
// fir.h

#ifndef __FIR_H__
#define __FIR_H__

#include <systemc.h>

const int N_TAP = 5;
const sc_int<8> coeff[N_TAP] = { 4, 7, 11, -1, 0}; // constant coefficients

SC_MODULE ( fir ) {
  // port
  sc_in   < bool >        clk;
  sc_in   < bool >        rstn;
  
  sc_in   < sc_int<32> >  port_in;
  sc_in   < bool >        port_in_valid;
  sc_out  < bool >        port_in_ready;

  sc_out  < sc_int<32> >  port_out;
  sc_out  < bool >        port_out_valid;
  sc_in   < bool >        port_out_ready;

  // variable
  bool                    tap_valid [N_TAP];
  sc_int<32>              tap       [N_TAP];
  
  // func
  void fir_main();
  void fir_ctrl();

  SC_CTOR ( fir ) {
    SC_CTHREAD(fir_main, clk.pos());
    reset_signal_is(rstn, false);

    SC_METHOD(fir_ctrl);
    sensitive << port_in_valid << port_out_ready;
  }
};

#endif
