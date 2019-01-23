////////////////////////////////////////////////////////////
// tb.h
//  Testbench

#ifndef __TB_H__
#define __TB_H__

#include <cstdlib>
#include <systemc.h>

enum stim_select_t {
  STIM_UNIT_STEP,
  STIM_RANDOM
};

SC_MODULE (tb) {
  sc_in   < bool >        clk;
  sc_out  < bool >        rstn;
  
  sc_out  < sc_int<32> >  in;
  sc_out  < bool >        in_vld;
  sc_in   < bool >        in_rdy;

  sc_in   < sc_int<32> >  out;
  sc_in   < bool >        out_vld;
  sc_out  < bool >        out_rdy;
        
  void driver();
  void monitor();

  sc_int<32> stim_unit_step(int);
  sc_int<32> stim_random(int);

  stim_select_t stim_select;
  
  SC_CTOR(tb) {
    std::srand(0);

    // argument
    std::string arg;
    for (int i=1; i != sc_argc(); ++i) {
      arg = sc_argv()[i];

      // stimulus
      stim_select = STIM_UNIT_STEP;
      if (arg.compare("-stim_unit_step")) {
        stim_select = STIM_UNIT_STEP;
      }
      if (arg.compare("-stim_random")) {
        stim_select = STIM_RANDOM;
      }

      switch (stim_select) {
        case STIM_UNIT_STEP:
          std::cout << "Select stimulus: unit step" << std::endl;
          break;
        case STIM_RANDOM:
          std::cout << "Select stimulus: random" << std::endl;
          break;
      }
    }

    // driver
    SC_CTHREAD(driver, clk.pos());

    // monitor
    SC_CTHREAD(monitor, clk.pos());
  }
};

#endif
