SHELL=/bin/bash

SYSTEMC_HOME=/usr/local/Cellar/systemc/2.3.2

ls_module=fir tb
ls_module_dot_o=$(addsuffix .o,$(ls_module))

CPP=g++
CPPFLAGS=-I. -I$(SYSTEMC_HOME)/include
LDFLAGS=-L$(SYSTEMC_HOME)/lib -lsystemc -lstdc++ -lm

default: main run

%.o: %.cpp %.h
	$(CPP) -c $(CPPFLAGS) -o $@ $<

main: $(ls_module_dot_o) main.cpp
	$(CPP) $(CPPFLAGS) $(LDFLAGS) -o $@ $^

run:
	./main
.PHONY: run

clean:
	-rm *.o main
