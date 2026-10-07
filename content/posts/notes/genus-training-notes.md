---
title: "GENUS Training Notes"
date: 2017-05-05
aliases:
  - "/blog/note/2017-05-05-genus-training/"
  - "/blog/tutorial/2017-05-05-genus-training/"
---

> The following is my notes of GENUS training course on Cadence's training module

# Module 03: genus fundamentals

## common UI vs legacy mode

* unified commands with Tempus
* common us: `set_db` & `get_db`
* legacy mode: `set_attribute` & `get_attribute`
  + `.synth_init` file: setup info, auto load when start legacy UI, can be skipped with `-no_custom` command line option

## explore design hier in legacy UI

* virtual directory structure
  + `/`: root dir
    - designs
      * top\_module
        + instances\_hier: current module's hier instances
        + instances\_seq: current module's sequential instances
        + instances\_cmb: current module's combinational instancs
    - libraries
    - hdl\_libraries
    - flows
  + use `find` to locate objects
    - ex. find all the pins `find /designs/* -pin *`
  + use `ls` + `cd` to navigate through this virtual directory structure
    - even `rm`, `mv`, `pushd`, `popd`
    - report all related attributes associated for all the pins: `ls -la [find /designs/* -pin *]`
* navigate UNIX disk
  + `lpwd`, `lcd`, `lls`

## attributes

* `set_attribute <attr_name> <value> <object>`
* `get_attribute <attr_name> <object>`
  + works on single object only
* get help
  + `get_attribute -h <attr_name> [<object_type>]`
    - get help on attribute
    - `<attr_name>` can include wildcards
  + `set_attribute -h`: reports writable attr
* attr are dependent on the stage of synthesis flow

## input and output

* input: RTL + constraint + library + power intent + physical
* output: netlist + LEC dofile + ATPG, scanDEF + constraints + physical design input files

## template script

* `write_template`

## flow

1. setup libraries

* `set_attribute init_lib_search_path <path> /`
* `set_attribute library $ls_lib`
* library domain for low-power design (if not included in CPF)
  + `create_library_domain {lib_domain1 lib_domain2}`
  + `set_attribute library $ls_lib1 lib_domain1 power_domain1`
* dont use
  + `set_attribute avoid <1/0> <cell_names>`
  + or use `set_dont_use <cell_names>`
* (optional) setup physical layout estimation (PLE)
  + dynamically calculates wire delays for different logic structures
  + vs Genus-Physical
    - floorplan DEF is optional
  + `set_attribute lef_library <lef_header>`
  + `set_attribute qrc_tech_file <qrc_tech_file_path>`
  + `set_attribute interconnect_mode ple`

2. read HDL

* `set_attr init_hdl_search_path <path> /`
* `read_hdl`

3. elaborate

* what
  + build data structure, infer registers
  + high-level HDL opt, remove dead code
  + identify clock gating candidates
  + overwrite parameters for diff modules
* `elaborate`
  + after elaboration, the `/designs` is populated
* `check_design -all`
  + must: unresolved references

4. read constraints

* `read_sdc` (preferred)
* `echo $::dc::sdc_failed_commands > failed.sdc`
* `check_timing_intent -verbose`
  + check failed commands and errors

5. opt directives

* preserve instances and subdesign (dont touch)
  + `set_attr preserve <option>` (more options than `set_dont_touch`)
    - false/true
    - delete\_ok
    - const\_prop\_delete\_ok
    - const\_prop\_size\_delete\_ok
    - size\_ok
    - map\_size\_ok
    - size\_delete\_ok
* grouping/ungrouping hierarchy
  + `group -group_name <name> <ls_inst>`
  + `ungroup <hier>`
  + disable ungrouping by `set_attr ungroup_ok false <inst>`
* boundary opt (default performed)
  + disable by `set_attr boundary_opto false <sub_design>`
  + use dynamic hierarchical check to verify boundary opt in conformal LEC
* opt sequential logic (default performed)
  + remove unused flops that is not driving an output port
  + disable by
    - `set_attr hdl_preserve_unused_register true /`
    - `set_attr delete_unloaded_seqs false /`
    - `set_attr optimize_constant_0_flops false /`
    - `set_attr optimize_constant_1_flops false /`
  + same thing to combinational logic that drives unloaded hier pins
    - disable by `set_attr prune_unused_logic false <pins>`
* merge sequential logic (default performed)
  + combine flops and latches that are equivalent in the same hierarchy
  + disable by
    - `set_attr optimize_merge_flops false /`
    - `set_attr optimize_merge_latches false /`
    - `set_attr optimize_merge_seq false <inst>`
* multibit cell inference (MBCI)
  + flops/tri-state cell/MUX/inverters/…
  + share clock to reduce power/improve reliability
  + LEC support
  + can control naming style (for verification)
  + `set_attr use_multibit_cells true`
* other opt
  + opt async reset logic
    - `set_attr time_recovery_arcs true /`
  + auto ungrouping
    - `set_attr auto_ungroup {none | both}`
  + keep the synchronous feedback logic immediately in front of the sequential elements (?)
    - `set_attr hdl_ff_keep_feedback`
    - affect how enable logic of a flop is implemented
  + opt TNS other than WNS
    - `set_attr tns_opto true /`

6. synthesis

* 1st level: `syn_generic <-physical>`
  + tech independent RTL opt
    - can skip for netlist-to-netlist synthesis
  + `set_attr syn_generic_effort`
    - medium by default
* 2nd level: `syn_map <-physical>`
  + mapping to lib, and logic opt
    - initial structuring
      * constant propagation, clock gating
      * structuring for best delay
    - target info
      * estimate timing
    - global mapping
      * mapping to meet target
    - global incremental
      * net/drive opt
      * timing tuning
  + `set_attr syn_map_effort`
    - high by default
  + check the slack, if too negative, check the constraint/design
* 3rd level: `syn_opt <-physical> <-spatial> <-incr>`
  + opt gates
    - fix drc, cleanup area, cleanup timing
  + `set_attr syn_opt_effort`
    - high by default
* global effort
  + `set_attr syn_global_effort`
  + set to express while explore flow
    - accept not clean design

7. analyze and report

* after elaboration
  + `check_design unresolved`
* constraint
  + `check_timing_intent`
  + use Conformal Constraint Designer (CCD) tool to validate timing constraint
    - `write_to_ccd validate -sdc > dofile` generate dofile used in CCD
* check `preserve` attributes, remove those that are not needed
* ungrouping small blocks can improve timing/area
* reports
  + report\_area
  + report\_dp (datapath)
  + report\_design\_rules (drc)
  + report\_messages
  + report\_power
  + report\_qor
  + report\_timing
  + report\_summary
* from GUI
  + timing -> timing lint: gives a thorough

8. gen outputs

* `write_hdl > filename`
* `write_sdc > filename`
* `write_design -innovus`

## command help

* `setenv MANPATH $CDN_SYNTH_ROOT/share/synth/man` to view man pages from UNIX shell

# Module 04: datapath

## datapath info in virtual file system

* /hdl\_libraries/
  + /hdl\_libraries/CW (chipware)
  + /hdl\_libraries/DW (designware)

## datapath operation

* architecture selection
* sharing and speculation (unsharing)
* carry-save arithmetic (CSA)
* …

## datapath directives

* CSA
  + `set_attr dp_csa {inherited|basic|none} <design>`
* sharing and speculation
  + sharing: improve area
  + `set_attr dp_sharing`
  + `set_attr dp_speculation`
* arch selection
  + manually control datapath arch selection (not recommended)
    - `set_attr user_speed_grade [find /designs* -subdesign <name>]` while speed can be ver\_fast|fast|medium|slow|very\_slow
* reordering (reorder input to opt critical path)
* ChipWare (CW)
  + also maps DesignWare components in RTL to CW

## opt in syn\_generic

* constant propagation
* resource sharing
* logic speculation
* MUX opt
* CSA opt
* datapath rewriting
  + QoR driven RTL code rewrite
  + by default during `syn_generic` with high effort level
  + no LEC impact
  + ex.

```
assign p = a - b;
assign q = a + b;
assign y = s ? p : q;

# better timing, smaller area
assign t = {16{s}} ^ b;
assign y = a + t + s;
```

## report

* `set_attr hdl_track_filename_row_col true /` before `read_hdl`
* `report_dp` after every stages: elaboration/syn\_gen/syn\_map/syn\_opt to track datapath components changes

# Module 05: debug design scenarios

## problem with sdc

* check the log file for errors and warnings
* check constraint consistency by `check_timing_intent -verbose` before synthesis

## path grouping

* cost group: opt cost groups simultaneously according to their weight, to minimize their WNS for each group
* path group -> cost group

## tighten/relax constraint

* emphasize some paths in opt without impacting output SDC
* `path_adjust -from <obj> -to <obj> -delay <delta_slack_ps>`
  + if delta\_slack\_ps < 0, tighten the path
  + if delta\_slack\_ps > 0, loosen the path
* use `rm [find /des* -exceptions pa_*]` before report timing to get normal timing reports
  + the adjustment will be in the timing report if not removed

## bottom-up design flow

* promote submodule
  + `create_derived_design` promote submodule to top-level module

# Module 06: physical synthesis

## why?

* for synthesis: all wires of fanout=n are the same
* for physical: each wire is unique
  + 80% to 90% of wires are local, the rest are big problems
* old tricks don't work: over-constraint

## how?

* incremental congestion prevetion
* structural datapath
* physical aware clock gating/logic structuring/mapping
* use floorplan as bridge to close pre and post layout gap
  + def file: must define die size; macro locations, fences/guides/regions are better to have (impact timing)
* genus vs innovus: 5% timing & wirelength diff

## spatial flow

* if backend is going to run full place\_opt, instead of `place_opt -incr` with genus-physical outputs as inputs, then no need to waste time on the final syn\_opt stage
* use `syn_opt -spatial` instead of `syn_opt -physical`

## PAM (physical-aware mapping) & PAS (physical-aware structuring)

* automatically turned on with `-physical`

## useful attributes

* `invs_enable_useful_skew`
* `phys_ignore_nets`
* `pqos_ignore_msv`
  + whether to pass lib or power domain info to INVS
* `invs_user_constraint_file`
  + sourced during INVS session
  + `invs_preload_script` & `invs_postload_script` & `invs_preexport_script`
* `number_of_routing_layers`
  + important to have
* `invs_pre_place_opt`
* `pqos_placement_effort`
  + congestion effort
* `invs_gzip_interface_file`
* `invs_temp_dir`

## correlation between genus-phys and invs

* ensure NDR and layer-promotion info is passed to innvous
* assure wirelength has good correlation

## early stage physical analysis

* at generic physical synthesis stage
* why?
  + analyze hier
  + hard macro locations
  + floor plan constraints
  + timing debug with gui

## check placement legality

* `check_placement`

## edit floorplan in Genus GUI

* go into edit mode

## report

* `write_report`
  + wrote QoS statistics
* `report_summary`
  + write summary table
* `write_snapshot`
  + design database and reports

## FAQ

* recommended flow
  + after synthesis with physical, `write_design -innovus`
  + then in innovus load the output data, and `place_opt_design -incr`
* what is under the hood of `syn_opt -phy`?
  + it calls `place_opt -phy_syn` in INVS, and load back the result and do low effort TNS/WNS opt
  + so the engine is the same between genus-phy and invs
* is it possible to do CTS in genus?
  + No. but simple CTS will be enabled in coming versions

## debug with common ui

* timing debug
  + timing -> debug timing
  + diff path groups histogram
  + highlight violating path

# Module 07: low power opt

* low power opt impacts timing a lot
  + trade-off

## flow

* enable clock gating
* annotate switching activities with TCF/SAIF/VCD
* apply clock-gating directives
* apply leakage/dynamic power constraints
* synthesis with clock gating insertion/power opt
* analyze

## multi-Vth lib

* low VT on timing critical path, high VT on non-critical path

## clock gating

* `set attr lp_insert_clock_taing true /`
* specify clock gating cell
  + customied: `lp_clock_gating_module` attr
  + select from library: `lp_clock_gating_cell` attr
* disable clock gating: `lp_clock_gating_exclude`
* control fanout of CGC: `lp_clock_gating_*_flops`
* common enable: `lp_clock_gating_extract_common_enable`
* clock gating for sync reset

## backannotate switching activity

* `read_tcf` (toggle count format)
* `read_saif` (converted to TCF internally)
* `read_vcd`
* manipulate activity with `lp_toggle_*` attr

## Joules: RTL power estimation

## effort

* `leakage_power_effort` attr
  + {none | low | high}
* disable leakage power opt
  + `max_leakage_power` must not be set while `leakge_power_effort` set to none
* dynamic vs leakage
  + `lp_power_optimization_weight` attr: power = weight \* leakage + (1 - weight) \* dynamic
    - normally, weight is close to 1
  + POPT-501

## report

* `report_clock_gating`
* `report_power`
* get power-related info
  + `lp_internal/leakage/net_power`
  + `lp_default_toggle_rate`
  + `lp_default_probability`

## useful attr

* `lp_clock_gating_exceptions_aware`
* `declone/share/split/merge_clock_gate`

# Module 08: design for test

## flow

* setup DFT rule, and check
  + shift enable
  + test mode
  + prevent scan mapping of flops
  + internal clock as test clock
  + DFT controllable constraints
  + abstract scan segment
* add test logic
  + insert test point
  + insert shadow logic
* synthesis
* setup DFT config, and preview scan chains
  + scan chain: number, length
  + control data lockup elements
* connect scan chains
* incremental opt

## DFT in virtual file structure

* /designs/dft

## DFT constraint

* 2 scan styles: controlled by `dft_scan_style` attr

1. muxed style (muxed\_scan) (most commonly used)
2. clocked LSSD (clocked\_lssd\_scan) (1 system clock, and 2 scan clocks)

* define shift enable signal
  + for muxed style: `define_shift_enable`
    - default one for common usage, or each chain has its own enable signal
  + for LSSD style: `define_lssd_scan_clock_a/b`
* define test mode signal: `define_test_mode`
  + put circuit in test mode so that gated clocks are all activated
* define test clock domains: `define_test_clock -name <name> -domain <domain> <pin_name>`
  + due to unbalanced clock tree, create separate test clock domains to prevent timing issues
  + lock-up latches (auto added) for crossing test clocks in the same domain, if more than 1 test clocks are defined in one domain
  + by default, in the same test clock domain use the same clock edge (controlled by `dft_mix_clock_edges_in_scan_chain` attr)
* define scan segment
  + `define_scan_abstract/fixed/floating/preserved_segment`
  + `define_scan_shift_register_segment`
  + `define_jtag_boundary_scan_segment`
* preserve nonscan flops
  + set `dft_scan_map_mode` attr to preserve
  + set `dft_dont_scan` attr to true
* control the length and number
  + by default, no max length for scan chain
  + `dft_min_number_of_scan_chains`
  + `dft_max_length_of_scan_chains`

## DFT rule check

* uncontrollable clock nets
* uncontrollable async set/reset nets
* conflicting clock and async set/reset net
* shift register rules
* abstract segment rules
* `check_dft_rules`
* `fix_dft_violations` (only for muxed style)
* `check_atpg_rules`
  + only generate script for Modus ATPG rule checker
* `check_design`
* `analyze_atpg_testability`
  + run Modus

## add DFT logic

* `insert_dft *`
* identify shift register to save area (auto done)
  + cmd = `identify_shift_register_scan_segments`
* mapping to scan in a already mapped netlist
  + `set_scan_equivalent`: one-to-one correspondence between non-scan and scan flop lib cells
  + `replace_scan`

## connect scan chains

* `connect_scan_chains`

## report and output

* `report_scan_chains`
* `report_scan_setup`
* `write_scandef`
* `write_dft_atpg*`: interface to ATPG tool
* `write_dft_abstract_model`

## bottom-up scan flow

* block level
  + create block level chains
  + `write_hdl -abstract`
  + `write_dft_abstract_model`
* top level
  + `read_dft_abstract_model`
  + `connect_scan_chains`

# Module 09: LEC

## guidance to address formal verification challenge

* challenges
  + datapath arch
  + ungrouping: no manual random ungrouping
  + boundary opt
  + phase inversion
* long run-time, werid mismatch

## recommended 2-step verification

* 1st-step: synthesis with preserved datapath modules/hier, restrict certain opt, min ungrouping, and output intermediate gate netlist
* 2nd-step: incremental synthesis with additional opt and ungrouping, and output final gate netlist
* compare: RTL vs intermediate netlist, then intermediate netlist vs final netlist

## cmd

* `write_lec_script -revised_design inter.v`
* `write_lec_script -revised_design final.v -golden_design inter.v`

## attr affects formal verification

* datapath: `dp_*`
* boundary opt
* ungrouping
* retime
* `wlec_*`

## in LEC

* `analyze datapath`: to analyze datapath modules
* `analyze abort -compare -thread 4`: multithreading abort resolving
* module-level datapath analysis (MDP)
  + improve quality
  + `analyze datapath -module xxx`

# Module 10: interface

## netlist

* possible modifications
  + bit blasted port/constants
    - `set_attr write_vlog_bit_blast_mapped_ports true /` and `set_attr bit_blasted_port_style %s_%d /`
  + name changing: `update_names` cmd
  + loop breaker: break comb feedback loops
  + remove assign statement (not needed in INVS)
    - `set_attr remove_assigns true /`

# Appendix

## retiming

* `set_attr retime true [find / -subd xxx]`
* `retime -prepare -min_delay -effort high [find / -subd xxx]` before `syn_gen`

## advanced low-power flow

* CPF
* MSMV

## common ui

* attr
  + set attr: `set_db <attr_name> <value> <object>`
  + query attr: `get_db <attr_name> <object>`
  + `help *clock* -attribute`
* virtual directory structure
  + `vcd`
  + `vls`
  + `rename_obj`
  + `vpopd`
  + `vpushd`
  + `delete_obj`
  + `vfind`
* examples
  + find all designs: `get_db .designs`
  + find all comb leaf inst under current directory: `get_db . .insts -if .is_comb`
  + find all inst of a certain cell type: `get_db insts -if {.base_cell.name == DFFX1}`
  + calc leakage power of a hier: `expr [join [get_db hinst:CORE/ALU .insts.leakage_power] +]`
  + fanout histogram

```
set tot [llength [get_db nets]]
for {set i 0} {$i <= 100} {incr i 5} {
    set n [llength [get_db nets -if ".num_loads>$i && .num_loads<[expr {$i+5}]"]]
    puts [string report "#" [expr $n * 100 / $tot]]
}
```

```
- find all pins: `vls -la [vfind /designs/* -pin *]`
```

* MMMC setup flow
  + `read_mmmc`
  + `read_physical -lef`
  + `read_hdl`
  + `elab`
  + `read_def`
  + `read_power_intent`
  + `init_design -skip_sdc_read`
  + `syn_gen/map/opt`

## clipper flow

* block level physical synthesis <-> unit level physical synthesis
  + unit level cannot understand block level's congestion and physical context issues
  + so pass timing/physical context DEF and constraint from block level to unit level
* CMD
  + `create_clip` at higher level
    - block boundary must be preserved (remember, genus is very aggressive about optimizing)
  + `read_clip` at lower level

# Advanced Synthesis

##
