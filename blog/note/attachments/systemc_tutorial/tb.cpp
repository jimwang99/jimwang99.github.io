////////////////////////////////////////////////////////////////
// tb.cpp
//  write(drive) a signal: xx.write(value)
//  read a signal: value = xx.read()

#include "tb.h"

sc_int<32> tb::stim_unit_step(int n) {
  sc_int<32> rtn;
  if (n > 23 && n < 29) {
    rtn = 255;
  } else {
    rtn = 0;
  }
  return rtn;
}

sc_int<32> tb::stim_random(int n) {
  sc_int<32> rtn;
  rtn = std::rand() % static_cast<int>(256);
  return rtn;
}

void tb::driver() {
  //------------------------------------------------------
  // reset
  in.write(0);

  in_vld.write(0);
  out_rdy.write(0);
  rstn.write(0);

  wait(10); // wait 10-cycle

  out_rdy.write(1);
  rstn.write(1);


  //------------------------------------------------------
  // stimulus
  //  unit step signal
  int n = 0;
  sc_int<32> v_in;

  while (n < 64) {
    if ((std::rand() % 2) == 1) {
      switch (stim_select) {
        case STIM_UNIT_STEP:
          v_in = stim_unit_step(n);
          break;
        case STIM_RANDOM:
          v_in = stim_random(n);
          break;
      }

      in_vld.write(1);
      in.write(v_in);

      do {
        wait();
      } while (!in_rdy.read());
    } else {
      in_vld.write(0);
      wait();
    }
  }
}

void tb::monitor() {
  sc_int<32> dut_out;

  for (int i=0; i<64; i++) {
    dut_out = out.read();
    wait();
    cout << i << " :\t" << dut_out.to_int() << endl;
  }

  // end simulation
  sc_stop();
}
