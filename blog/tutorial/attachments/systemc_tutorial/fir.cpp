////////////////////////////////////////////////////////////
// fir.cpp
//  simple 5-tap 32-bit FIR

#include <iostream>
#include "fir.h"

void fir::fir_main (void) {

  // reset (anything here before the first wait(), will become reset statement in rtl)
  // when reset signal asserts, this thread will restart from here
  for (int i=0; i<N_TAP; i++) {
    tap_valid[i] = 0;
    tap[i] = 0;
  }
  port_out.write(0);
  port_out_valid.write(0);

  wait(); // wait for the clock, can accept 1 argument which is the number of cycles

  while (true) {
    if (in_valid.read() & in_ready.read()) {
      // FIR: shift the tap
      for (int i=N_TAP-1; i>0; i--) {
        tap_valid[i] = tap_valid[i-1];
        tap[i] = tap[i-1];
      }
      tap_valid[0] = 1;
      tap[0] = in.read();

      // FIR: multiply the coefficiency with tap
      sc_int<32> val;
      for (int i=0; i<5; i++) {
        val += coeff[i] * tap[i];
      }

      // output
      out.write(val);
      bool valid = true;
      std::cout << sc_time_stamp() << "\t";
      for (int i=0; i<N_TAP; i++) {
        valid &= tap_valid[i].read();
        std::cout << tap_valid[i];
      }
      std::cout << endl;
      out_valid.write(valid);

      if (valid) {
        do {
          wait();
        } while (!out_ready.read());
      } else {
        wait();
      }
    } else {
      out_valid.write(0);
      wait();
    }

  }
}

void fir::fir_ctrl (void) {
  bool ready = port_out_ready.read();
  for (int i=0; i<N_TAP; i++) {
    ready |= !tap_valid[i].read();
  }
  port_in_ready.write(ready);
  std::cout << sc_time_stamp() << "\t: ready=" << ready << " in_ready=" << in_ready << endl;
}
