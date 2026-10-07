---
title: "INNOVUS Training Notes"
date: 2017-04-01
aliases:
  - "/blog/note/2017-04-01-innovus-training/"
  - "/blog/tutorial/2017-04-01-innovus-training/"
---

> The following is my notes of INNOVUS training course on Cadence's training module

# Module 02: overview

* “gift” directory contains lots of useful scripts to help productivity
* Independent “viewlog” utility or “Tools->Log Viewer” will start a GUI to help understand log files better.
* Batch mode: `innovus -no_gui -init batch.tcl`
  + `win` / `win off` to show/hide GUI

# Module 03: import design

## Input

* Netlist in Verilog
* Floorplan in DEF
* Clock tree spec auto gen from SDC
* Scan info in Tcl or DEF
* I/O info (pads or pins)
* GDS layer map (if want to dump GDS)
* Timing constraint in SDC
* Timing library in .lib
* LEF library of cells
* Tech file for extraction (cap table or qrc)

## import design

* Save all the input file paths and parameters in a .globals file, then next time just use `source design.globals; init_design`.
* Q: what if there is errors, such as mismatch between netlist and libraries?
  + A: in early stage, mismatch is OK. For example, importing a new Verilog netlist but along with an old DEF containing floorplan. But in late stage, the mismatch is serious.
* Tips: save and load a workspace (window layout) use menu “Windows -> Save Workspace”.
* Tips: menu could be customized using terminal commands “ui\*”

## check design

* `checkDesign` to detect missing/inconsistency
  + ex: checkDesign -floorplan -outfile checkDesign.floorplan.rpt
  + ex: checkDesign -timingLibrary

## design mode

* `setDesignMode -process 16 -flowEffort {express|standard|extreme}`

# Module 04: select and highligh obj

## select

* `selectObjByProp <objType> <expression>`
* F12: dim the background
* “instance (right click) -> highlight instance nets”

## design browser

* “tools -> design brower”
* All design stuff in a tree; can use it to select obj and do placement
* Color the modules: right click on “modules”

## schematic viewer

* “tools -> schematic viewer”
* To explore design changes
* Can cross-probe to physical window

## three views

* floorplan view
* amoeba view : display outline of modules/sub-modules after placement to check locality of the module
* physical view: detailed placments and routing

# Module 05: floorplan

## sites and rows

* site: basic horizontal unit
* row: core rows / IO rows

## what is floorplanning?

* define die size
* place IO
* create soft blocks
* power planning
* macro placement
* early routing congestion/utilization check

## specify floorplan

* “floorplan -> specify floorplan” = `floorPlan`
* Leave space between core and IO to place power rings
* Tips: evaluate routing resource (number of layers, routing tracks) to decide if the core should be high & thin or short & wide
  + core utilization = standard cell + macros / area
  + cell utilization = standard cell / area
* orientation
  + R0: no rotation
  + R90: counter-clockwise 90 degree rotation
  + MX: mirror through X axis
  + MY: mirror through Y axis

## assign pads and pins

* either read in DEF file or Innovus IO file format; or randomly create one then dump out and modify
* “edge 0” is the left-most edge at Y=0 which is the staring point for IO assignment
* “User Guide -> infrastructure -> data preparation -> generating the IO assignment file”

## automatic floorplan

* Seed: design blocks definition used to guide the auto floorplan (not a seed for randomization)
* Use `setPlanDesignMode` to control some advanced placement options
* use `planDesign` create init floorplan
* NOTE: most of the time, not useful at all

## floorplan toolbox

* placement blockage type
  + hard: restricted no
  + soft: can be used during place opt, CTS, ECO, legalization
  + partial: percentage of unavailability
* routing blockage: layer / type specific
* rectilinear object use scissor tool
* rectilinear floorplan
  + view -> preference -> enable rectlinear design
* “floorplan -> resize” = `setResizeFPlanMode` / `resizeFloorplan`
* stairway style floorplan edge
* relative floorplan: move in a group
  + `create_relative_floorplan -horizontal_edge_separate {target_edge distance ref_edge} -vertical_edge_separate ...`
  + `delete_relative_floorplan`
* “floorplan -> edit floorplan” has the same tools with the toolbox to do the job

## create row

* “floorplan -> row -> create core row” = `createRow`
  + need to choose the site
* rows can be stretched using “floorplan -> row -> stretch core row”
* sometimes can create rows outside of core into the pad area

## rectilinear blockage

* also use the “cut rectilinear” tool

## module constraint types

* 5 different levels of module constraint types
  1. None
  2. soft guide (SoftGuide): weakly grouping instances under the same soft guide, but actually they can be placed through out the whole core area
  3. guide (Guide): preplacement guide for the module in the core design area
  4. region (Region): force instances in the regsion, but allow other modules in as well
  5. Fence (Fence): like region but don't allow other modules. A module becomes a fence when the module is specified as partition. Usually used for hierarchical (bottom-up) design.
* Tips: when first imported design, all std cell instances will be under the same top module, you have to ungroup it to break it down into pieces.
* Tips: TU = target utilization (std cell + macro); EU = effective utilization (std cell + macro + blockage)

## instance placement status

* change from “placed” to “fixed” after floorplan for macros
* softfixed: cannot be moved by global placement, but can be moved by legalization and upsize by optimization

## placement halo

* diff from blockage, halo move along with the target block
* “floorplan -> edit floorplan -> edit halo” = `addHaloToBlock` / `deleteHaloFromBlock`

## routing halo

* prevent signal integrity issues around macros
  + direct connection is ok
  + no long wires
  + no jogging
* “addRoutingHalo” / “deleteRoutingHalo”
* Tips: snap objects (region/guide/macro/blockage to instance grid or routing track)
* Tips: “floorplan -> clear floorplan” = “deleteAllFPObjects” / “deleteSelectedFromFPlan”

## instance group

* create instance group to group instances without changing the logic hierarchy for physical implementation
* `createInstGroup` / `addInstToInstGroup`
* OR `createLogicHierarchy` to change the netlist if preferred

## auto finish floorplan

* “floorplan -> automatic floorplan -> finish floorplan”

## save floorplan

* `writeFPlanScript`

## How to reduce die size

* shape is important, considering routing layers are diff in horizontal and vertical directions
* start from 70% utilization, then iteratively evaluate the timing/congestion results

# Module 06: power plan

## What is power planning?

* create rings/strips
* define global power/ground nets, as well as power structures

## commands

* “power -> power plannning -> …” or `addRing/addStripe/editPowerVia`
  + Full Geometry Checker (FGC) is enabled under 20nm process
* “power -> connect global nets” or `globalNetConnect` to connect PG nets logically
  + `globalNetConnect VDD -type pgpin -pin VDD -all`
  + `globalNetConnect VSS -type tielow`
  + ?shouldn't this be a part of UPF's function?

## add rings

* for whole core or blocks or IO
* advanced tab
  + extend to re-use core ring for block rings
  + add ring around cluster of selected blocks
    - `addRing -type block_rings -around cluster/shared_cluster`
  + use wire groups, to avoid max width DRC

## add stripes

* the concept of “set”
  + ex. physically the power/ground wires are (VDD–VSS——VDD–VSS), then the set distance is from first VDD to next VDD
* also have the option to connect to wire groups of the ring
* advanced tab
  + break strips at block ring: “omit stripes inside block rings”
  + “merge with ring” to save resource by defining a threshold
  + `setAddStipeMode -orthogonal offset` to control strips go beyond or within the edge of the block
  + `setAddStripMode -break_at blocks_without_same_net` to disjoint stripes in different power domain

## via gen

* for overlap area of strip/ring
* shrink size of via to allow more routing resources for signal
* “target penetration”: how long the target wire goes into the fat wire

## Tips

* ignore DRC during early stage, to save run-time

  ```
  setAddRingMode -ignore_DRC true
  setAddStripeMode -ignore_DRC true
  setViaGenMode -ignore_DRC true
  ```
* optimize for routing track saving: shift the power stripe a little bit to save routing tracks
  + `setAddStripMode -optimize_stripe_for_routing_track shift`
* change VIA enclosure metal style to avoid spacing DRC to save tracks
  + `setViaGenMode -optimize_via_on_routing_track true`
* add vias -> “verify\_drc” -> “fixVia” to fix violations caused by inserting via

## power and rail analysis

* the same setup and interface with voltus

## early rail analysis

1. initial floorplan
2. build power grid
3. static IR/EM analysis
   * ?with what power numbers?
4. refine floorplan and power rail and redo step 3

# Module 07: power routing

## What is power routing?

* use SRoute to connect power pins of std cells/blocks/IOs
  + the power pin routing for std cells are called “follow pin” in Innovus

## How to?

* area-based incremental routing: limit the routing inside certain box
  + be careful of the outcome of selecting “connect to target inside the area only”, it does exact as stated
* extend power ring to connect nearby target (mostly used for memories)

## power pin def in LEF

* “CLASS BLOCK” the same with signal pins, that connect directly
* “CLASS RING” will connect any overlap power stripes

# Module 08: place opt

## spare cell

* “place -> place spare cells”
* module aware spare cell placement: within the bound of the hierarchy, otherwise spare cells are spread out within the placement area
* create spare cells
  + `createSpareModule`
  + `placeSpareModule`
* `reset_spare_inst` will revert spare cells’ placement

## cell padding

* placement clearance: used to reserve space for placement or routing or IR drop
* `specifyCellPad $master_cell_name`
  + `-top -bottom`: # of rows
  + `-left -right`: # of sites

## JTAG

* along the periphery at the chip boundary
* `specifyJtag` / `traceJtag`
* “place -> place jtag”

## blockage for preroutes

* under preroutes with “SHAPE” attr = “STRIPE”
* “place -> specify -> placement blockage” = `setPlaceMode -prerouteAsObs`

## magnetic placement (to place target inst close to ref inst)

* use `place_connected` (before place\_opt\_design)

## placement mode

* “tools -> set mode -> mode setup -> placement” = `setPlaceMode`
  + “ignore spare cell connection” will distribute spare cells evenly
  + “speicify maximum routing layer” to control fewer than max routing layers to be used
  + `-quickCTS`: create zero skew clock tree
  + `-clock_power_driven` to place leaf flops closer to clock gates
  + `-enableFGC` to check geometry DRC
  + `-maxDensity` to achieve better timing in low utilization designs

## early clock flow during place\_opt\_design

* fast clock clustering during placement
* more accurate estimate of skewing impact
* `setDesignMode`
  + `-earlyClockFlow`: enable/disable clock clustering in place\_opt\_design
  + `-usefulSkewPreCTS`: enable/disable ideal mode useful skew, default is true

## instace place group

* ex. a group of identified regsiters have to spaced apart by a certain value, and cannot share the same well to guarantee functional safety (?why?)
* `create_inst_space_group`
* `checkPlace` will report distance violation if defined

## GigaPlace

* becomes slack-driven by gate delay, false/multi-cycle paths, layer assignment, congestion timing effects, correlates with GigaOpt, instead of timing-driven which is lightly integrated
* interleaves placement and optimization intead of sequential

## command: `place_opt_design`

* use `-incremental` to start with an existing placement
* `-place_opt_post_place_tcl` to insert tcl script between placement and optimization interleaves

## placement blockages

* 3 different types: hard, partial, soft
  + hard block: 100% restricted rule
  + for soft blockage, `setPlaceMode -selectiveBlockage true` + `specifySeletiveBlkgGate` can specify cells/instances that are allowed to be placed inside soft blockages
  + partial blockage can specify how much of the area can be used for global placement
    - use it to fix localized congestion
* TIPS
  + first run place\_opt\_design with defaults
  + if the design is congested, try `setPlaceMode -congEffort high`
    - high congestion effort will use aggressive cell padding
    - cells with lots of IO will be padded
  + if have local congestion hotspots
    - use `setPlaceMode -modulePadding` for logic module based padding
    - or use partial placement blockages for physical location based padding
  + use “place -> display -> density map” = `reportDensityMap` to check for densities

## place physical cells

* tie cells: `setTieHiLoMode` & `addTieHiLo`
* decap cells: `addDeCap`
* well taps: `addWellTap`
* end cap: `addEndCap` (to handle end-of-row well tie-off requirements)
* filler cells: `setFillerMode` & `addFiller`

## check placement quality

* Amoeba view: how placement of modules are clustered together
* density map
* after trial route, check congestion
* “place -> check placement” = `checkPlace`
* “tools -> violation brower” to see the violations for previous `checkPlace` command
* “place -> refine placement” = `refinePlace`: check DRC and pin access for routing
* “place -> query density -> query place density” = `checkFPlan -reportUtil`
* “place -> query desity -> query pin density” = `queryPinDensity`

# Module 09: scan opt and reordering

## what are scan chains?

* make flops controllable and observable
* reordering: use less routing resource

## load scan chain info

* why? to ignore scan chain while placement, to reduce routing congestion and wire lengths
* `specifyScanCell` to define scan cells
* `specifyScanChain` or use scan DEF to specify scan chain
* NOTE: if no scan def, placement and routing will have big differences to what we really want

## create scan DEF

* `defOutBySection -noNets -noComps -scanChain scan.def`
* scan DEF keywords
  + “SCANCHAINS”
  + “START PIN” & “STOP PIN”

## reorder scan chain

* `setScanReorderMode`
* `scanTrace` to trace for lockup latches
* by default, `place_opt_design` will reorder scan chains, but it also can be done separately with `scanReorder` cmd

## cmds

* “place -> display -> scan chain” = `displayScanChain`
* “place -> scan chain -> delete” = `deleteScanChain`

# Module 10: early global route

* to analyze routing feasibility

## routers in innovus

* SRoute for power routing
* early global route for congestion analysis (not DRC or LVS clean), needed for preliminary extraction/STA, not for SI analysis
* NanoRoute: detail routing (sign-off quality)
* fcroute (flip chip router) to route power/signal to bumps
* high frequency router: for mixed signal design

## features of early globl router

* create actual wires
* produce congestion map
* fast w/o fixing DRC/LVS
* not for SI analysis

## commands

1. `setAttribute` for special net NDR
   * width, spacing, preferred routing layers, shielding
2. `setRouteMode`
   * routing layer, routing direction, congestion result tuning
   * should use the same routing constraints as NanoRoute for consistency and better correlation
3. `earlyGlobalRoute`

## congestion map

* red diamond symbol represents overflow of routes
* todo: adjust block placement and/or orientations
* todo: use partial placement blockage to lower congestion
* tune congestion value for tials (what-if)

## statistics based on GCells (size can be redefined)

* GR compatible: # of GCells that overflow, don't distinguish the level of overflow, that means overflow of 1 and overflow of 3 is the same
* non GR compatible: consider the overflow levels that means overflow of 1 and overflow of 3 are different, so the number of percentages are higher than the first one
* both ignore fully blocked Gcells

# Module 11: MMMC (multi-mode multi-corner analysis)

## analysis view hierarchy

* `create_analysis_view`
  + `create_constraint_mode`
  + `create_delay_corner`
  + `update_delay_corner` (power domain definition)
  + `create_rc_corner`
  + `create_op_cond`
  + `create_library_set`

## library set

* a group of library files from different process corners, operating voltages (for MSMV power domain)
* can include both timing .libs and signal integrity .cdb

## rc corner

* cap table
* qrc file
* temperature

## delay corner

* aggregate of library set and rc corner

## constraint mode

* a set of .sdc file to define clock, condition, IO timing, path exception, etc.

## analysis view

* aggregate of delay corner and constraint mode
* DON'T forget to activate analysis views
  + `set_analysis_view -setup ... -hold ...`
* don't need to use all of the defined analysis views in early design stages
* `report_analysis_view` / `all_analysis_view` / `all_setup_analysis_view` / `all_hold_analysis_view` / `get_analysis_view`
* save it as Tcl in a view definition file
* “timing -> MMMC brower” to setup or view MMMC views

## perform timing analysis

* `timeDesign -expandedViews`

# Module 12: extract parasitics and run timing analysis

* timing analysis should be done every steps through the entire flow. if any step hasn't met timing requirements, or timing is too bad to be fixed afterwards, we should go back and find out the reason.
* every steps in innovus use the same timing engine (but with different extraction accuracy)

## “timing” menu item

* cmd: `extractRC` + `timeDesign`

## preroute extraction flow

* after global preroute
* “tools -> set mode -> preroute”
* cmd
  + load viewDefinition.tcl with QRC file (don't use cap table under 32nm)
  + `setDesignMode -process xx`
  + `setExtractRCMode -engine preRoute`
  + `extractRC`

## postroute extraction flow

* “tools -> set mode -> postroute”
  + can choose different effort level
* cmd: similar to preroute extraction, just use `-engine postRoute` instead
  + `-effortLevel high` will use integrated Quantus extraction engine
  + `-effortLevel signoff` will use standalone Quantus engine
  + NOTE: from Michael's comparison, effort high and signoff has less than 5% differences in RC number

## extract RC data

* “tools -> extractRC” = `extractRC`
  + to delete extracted parasitics but maintain the RC extraction modes, use `reset_parasitics`

## cap table (ascii)

* can be used in hand calculation
* `generateCapTbl`

## RC correlation (important!)

* correlate build-in extractor and sign-off extractor use “Ostrich” utility
  + cmd is `ostrich`
  + it can generate a histogram of how 2 SPEF files correlate
  + OR `generateRCFactor`
* super important!
  + don't miss any critical path in early stage

## Global OCV

* `set_timing_derate -delay_corner_name xxx -early x.x -late x.x`
* use `setAnalysisMode -cppr both` too remove clock path pssimism for common clock path
* in both worst and best caes conditions (setup and hold), they has both early and late path

## AOCV (advanced OCV)

* to reduce process pssimism
* cmd: `setAnalysisMode -aocv true -analysisType onChipVariation -cppr both`
* require info from AOCV library
  + `create_library_set -aocv xxx.aocv`
* basically, decrease OCV factor based on the path depth. more cells on th path, less OCV (closer to 1.0)
* GBA (graph-based analysis)
  + stage counting start from CPPR common point

## SOCV (statistical OCV)

* models a statistical representation of **delays** for different input slew and ouput load, for both early and late path
* captured in LVF table (liberty variance format) in timing lib as something like “ocv\_sigma\_cell\_rise”
* “tools -> set mode -> speicfy analysis mode” = `setAnalysisMode -socv true`
* if using PrimeTime, need to use the following cmd to take differences of default settings into consideration
  + `setDesingMode -thirdPartyCompatible true`

## gen SDF

* “timing -> write SDF” = `write_sdf -target_application verilog -setuphold merge_when_paired -view xxx xxx.sdf.gz`

## timing analysis

* use pre-place option in timing analysis to check constraints (no RC numbers at this stage at all)
* `timeDesign`
* `report_timing`
  + `-format` to customize report fields
  + `-path_group` to narrow down
    - `group_path`
    - `createBasicPathGroups -reset` to create reg2reg, in2reg, reg2out, in2out, clkgate path groups
    - `get_path_groups`

## timing debug

* “timing -> debug timing” GUI
  + global path histogram
  + SDC cross-probing
  + highlight path in their physical location
* start timing path analyzer by double-click the path
  + path SDC shows all the SDC constraints of current path to debug constraint issues
  + NOTE: similar GUI with mSTA
* TIPS: make sure to close most of timing problems pre-CTS, because later in the design stage fewer methods could be used
* TIPS: narrow down the debug, from several thousands of violation paths to a small subset of failing path (summarize the similar cause)
* TIPS: check for unexpected numbers in timing report
  + clock latency/skew/uncertainty
  + unexpected large/small delay of certain instances and nets
  + path depth (too large? too small?)
  + cells in the path (a chain of back-to-back buffers)
  + net load/slew/fanout
  + derating (expected?)
* TIPS: physical domain related failing paths
  + congested place area
  + congested routing area
  + placement widely spread
  + instance correctly spread from start point to end point?
  + detour of path (usually around power domains or hard macros)
  + channel sized correctly?
  + power domain shaped optimally?
* TIPS: check the log file for more hints
* TIPS: even if overall timing looks good, still need to investigate some of the worst timing paths
* TIPS: fix issues as early as possible
* TIPS: if all violations are concentrated in one clock domain, check SDC first, CTS second
* TIPS: for narrow channels between SRAM's, congestion will be problem and cause timing issues. use partial blockage or soft blockage in the channel to reduce congestion
* TIPS: problem caused by floorplan may need several iterations to find a really useful solution
* root cause of timing issues
  + design issue
  + placement/floorplan issue
  + timing constraint issue
  + database problem
  + user error
  + script/flow/methodology issue

# Module 13: optimize and close timing

## what is opt?

* 4 objectives: timing, SI, power, area

## opt operations

* add/delete buffer
* resize gate
* restructure netlist
* remap logic
* swap pin
* move inst
* apply useful skew
* layer opt
* track opt

## how to use opt?

* “tools -> set mode -> mode setup” = `setOptMode`
  + timing effort: to opt power only, change this to “None”
  + simplify netlist
    - remove dangling output instances
    - propagate constants
    - remap useless logic
* “ECO -> optimize design” = `optDesign`
  + `-preCTS`
  + `-postCTS`
  + `-postRoute`
* debug info in .logv file: `setOptMode -verbose`
* during placement, `place_opt_design` includes setup opt
* during CTS, `ccopt_design` includes setup opt
  + use `ccopt_design -cts` to create **zero skew** clock tree, and then use `optDesign -postCTS` to opt setup, use `optDesign -postCTS -hold` to opt hold
* after routing, use `optDesign -postroute -setup -hold` to opt setup and hold

### with path group

* `group_path` + `setPathGroupOption $name -efforLevel` to specify different effort level for different path groups
* 2 automatically created high-effort path groups: reg2reg & reg2clkgate
* create custom path groups to over optimize some paths, but only recommended to use `optDesign -incr` for these path groups for better TAT

### track opt during routing

* `routeDesign -trackOpt` auto involve “tQuantus” after global route and track assignment to opt global route and track assigment. “tQuantus” is not sign-off accurate, but much faster
* cmd

```
setExtractRCMode -engine postRoute -effortLevel medium
setDelayCalMode -SIAware true
setAnalysisMode -analysisType onChipVariation -cppr both

routeDesign -trackOpt
```

* TIPS: generate scale factors before running tQuantus

### NDR (non-default routes)

* `setOptMode -ndrAwareOpt $ls_ndr` before use `optDesign` to improve timing
* how to define NDR
  + LEF file
  + `add_ndr`
* TIPS: don't use too many NDRs, cos runtime. one NDR (2W,2S) is optimum

### route-driven opt (layer aware opt)

* advanced nodes (<20nm), higher layer has smaller RC than lower layer, so they are optimum for long/critical routing
* `setOptMode -layerAwareOpt` (which is activated automatically)

### stop reclamation during power/area opt

* opt engine will auto opt power/area for all the path with positive slack, and most of the time we want to keep some margin
* `setOptMode -setupTargetSlackForReclaim $slack`
  + use positive $slack

### total negative slack opt

* by default, opt only worst negative slack paths
* to run opt for all negative slack paths, use `setOptMode -allEndPoints true`
  + auto activated during high-effort timing closure flow

## view pruning

* by default, innovus will auto determin dominant views out of all user active views, and only work on dominant views to opt TAT
* timing reports operate on these presistent dominant views not all user active views

## layer-aware buffering

* layer-aware opt is part of timing opt, but for buffer trees it's more important, so it's enabled by default
* it will be down in pre-CTS opt and post-CTS opt

## max wire length rule

* use `setOptMode -maxLength $um` to limit the wire length by inserting repeaters
  + the same with other DRV rules, such as max\_cap, max\_tran, max\_fanout

## correlate with PT

* `read_sdf -view $view1` + `optDesign -postRoute -useSDF`, then opt engine will fix violations based on timing analysis using the SDF delays from PT

## correlate with StarRCXT or CalibreXT

```
read_parasitics -rc_corner
timeDesign -reportOnly
setSIMode -acceptableWNS
read_sdf -view
optDesign -postRoute -useSDF
```

## interactive ECO

* “ECO -> interactive ECO”
  + add/delete buffer/inst
  + change cell
* support experiment with “eval” button

## report unfixed hold paths in details

* `setOptMode -reportHoldPathLimit $n` + `optDesign -holdVioData $fname`
  + path, slack, and the reason why it cannot be fixed

## power driven opt

* `setDesignMode -powerEffort none|low|high`
* leakage to dynamic power ratio
  + `setOptMode -leakageToDynamicRatio $x` while x is from 0 to 1
  + by default, x=1.0 means focus on leakage power reduction
  + x=0.0 means focus on dynamic power reduction
  + x=0.5 means balance
* then use `optPower` at diff stages to opt power

## signal EM (electromigration) opt

* opt methods
  + wider wire
  + smaller driver
  + more buffer
* flow

```
verify_drc; # (optional) in Innovus
verifyACLimit -report $rpt_fpath; # in Innovus or Voltus
fixACLimitViolation -useReportFile $rpt_fpath -maxIter $n; # in Innovus
```

```
- num of iterations for `fixACLimitViolation` is from 1 to 3. Use 1 only will widen wire; use 2 will downsize buffer; use 3 will add buffer. So both 2 and 3 need ECO route.
- activity file is important
```

* use net-based NDR to fix EM
  + `add_ndr -name $rule -width`
  + `setAttribute -net $net -em_ndr_rule $rule`

## timing closure flow

* `setDesignMode -flowEffort standard|extreme|express`
  + express: to prototype
  + standard: default, good for majority of designs
  + extreme: 10% to 30% better QoR at the expense of TAT, need extra license
* TIPS: power optimization needs to be run explicitly anyhow by using `setDesignMode -powerEffort` and `optPower`
* TIPS: disable useful skew needs `setOptMode -usefulSkewPreCTS false` + `setOptMode -usefulSkewCCopt None` + `setOptMode -usefulskewPostRoute false`
* TIPS: track opt is not turned on by default in standard flow
  + use `routeDesign -trackOpt` to turn it on in standard flow
* TIPS: postroute area reclaim is not turned on by default in standard flow
  + `setOptMode -postRouteAreaReclaim setupArea/holdAndSetupArea`

## targeted post route opt

* target on select timing-critical nodes, either let tool auto select or provide it some file and choose the type of opt to run
* `setOptMode -targetBasedOptFile $fname`
  + `-targetBasedOptFileOnly`
* `optDesign -postRoute -targeted`
* report with a summary table that has the num of nodes, transforms committed
* use “global timing debug” to generate target file interactively

## TIPS

* verify timing constraints
  + `timeDesign -prePlace`: if timing is not met after synthesis, it most likely is not met during implementation
  + use same constraint for implementation and sign-off
* check congestion
* leave 5~7% margin of utilization for opt
* after opt, exam remaining violation paths
  + check congestion issue
* fix hold time
  + make sure hold timing uncertainty is realistic
  + *allow delay cells*
  + add cell padding during placement, then remove them before postCTS opt, to reserve space for hold fixing
  + check clock skew

# Module 14: CTS

## traditional balanced clock methodology

* there is no **fundamental** timing requirements that clocks need to be balanced
* more buffer to balance clock, or other expensive options: mesh or spine
* IR drop is severe cos everything trigger at the same time
* no useful skew to help critical path, so more TAT/area/leakage

## CCOpt with useful skew

* concurrent useful-skew and datapath opt
* critical chain instead of critical path
  + a chain has larger delay/stage, even don't have critical path

## clock tree vs. skew group

* `create_ccopt_clock_tree` to specify subset of circuit which CTS can operate on
  + with physical constraints of max trans/cap/wire length, NDR, repeater cell sets
* `create_ccopt_skew_group` to create a group of pins in clock tree
  + balance constraints of skew/insertion delay

## flow

```
# place
place_opt_design

# load post-CTS timing constraints, and avoid set_propagated_clock

# settings
setOptMode

# set NDR for clock routing
create_route_type -name xxx
set_ccopt_property route_type -net_type {leaf, trunk, top} -clock_tree $name

# specify CTS cells to use
set_ccopt_property cts_buffer_cells
set_ccopt_property cts_inverter_cells
set_ccopt_property cts_gating_cells

# specify DRC rules
set_ccopt_property target_max_trans
set_ccopt_property target_skew

# gen clock tree spec
create_ccopt_clock_tree spec

# run ccopt
ccopt_design -ckSpec

# post-CTS opt for hold (which is not included in ccopt_design)
ccopt_design -postCTS -hold

# routing
routeDesign

# post-route opt, includes DRV and skew fixing
optDesign -postRoute -setup
optDesign -postRoute -hold
```

## clock spec

* analyze multi-mode timing graph
* create clock trees and skew groups and property setting
* can be written out as a TCL file

## useful skew controls

* can be controlled for every stage of the flow
* diff of effort levels: `setOptMode -usefulSkewCCopt` + `ccopt_design`
  + none: skew balanced
  + standard: skew balanced CTS + useful skew in post-CTS
  + medium: useful skew in CTS + useful skew opt in post-CTS
  + extreme: medium + hold aware
* the `setDesignMode -flowEffort` will have impact on ccopt

## specify ccopt route types

* cos at the end of ccopt, clock signals will be routed with NanoRoute (detail route), so we have to prepare
  + clock NDR
  + layer range
  + shielding
  + length based tables
* leaf/trunk/top
  + leaf: nets connected to leaf cells
  + top: user defined as net that connected to > N fanouts
  + trunk: all other nets
* cmd
  + `create_route_type`
  + `set_ccopt_property route_type -net_type {trunk leaf top}`
  + `set_ccopt_property -name buffer_cells`
  + to use inverters only `set_ccopt_property use_inverters true`

## specify halo for clock cells

* `set_ccopt_property cell_halo_x/y -cell $name $um`
* `report_ccopt_cell_halo_violations`

## define ccopt clock network

* `create_ccopt_clock_tree`
* `delete_ccopt_skew_group`
* `delete_ccopt_clock_tree`

## early clock flow during placement

* move CTS config before `place_opt_design` to get more accurate estimate of skew impact during placement opt
* don't use `set_propagated_clock`
* `setDesignMode -earlyClockFlow true`

## debug clock tree

* `set_ccopt_mode -cts_opt_type {cluster|trial|full}`
* `ccopt_internal_messages -on`
* `ccopt_check_prerequisites`
* `get_ccopt_property -help *`
* `report_ccopt_clock_tree_structure`
* clock tree debugger
  + dotted line connects same cell in diff trees

## postroute fixing

* `ccopt_pro` is included automatically in `optDesign -postRoute` for clock DRV and clock skew
  + it only do sizing cell, not inserting buffers

## Flexible H-Tree

* vs. clock mesh and traditional CTS tree
  + less power than mesh
  + better OCV than trad CTS
  + don't need rectangle floorplan
* interesting points
  + use dummy buffers to keep tree topo balanced
  + multi-corner aware balancing, scaling better in every corners
  + detour around blockage
* limitations
  + no logic or clock gating
* CMD
  + `create_ccopt_flexible_htree`
  + `synthesize_ccopt_flexible_htrees`
  + `ccopt_design`

# Module 15: detail routing

## LEF (library exchange format)

* 2 parts
  + tech section
    - layer definition: metal/via
  + cell/macro sections
    - pin locations
    - OBS (obstruction, don't route)
* gen LEF file
  + `set_abstract_mode`
  + `run_abstract`
* **line-to-via pitch**
  + line width \* 0.5 + via enclosure \* 0.5 + spacing
  + use line-to-via pitch as minimum pitch for metal, instead of line-to-line pitch, cos via intends to have larger width and spacing requirements

## optimal routing tracks and cell size

* std cell height and width should be multiple of horizontal routing grid and vertical routing grid
* align routing tracks in the same preferred direction

## gen routing tracks

* normally use defaul values from foundry
* `add_tracks` to override
  + `report_tracks` to report

## gen via

* the detail routing tool “NanoRoute” will gen via automatically.
* bar via: multicut or single cut?
  + if large enough, considered as multicut
  + look at the `CUTCLASS` keyword

## optimize routing

* off-grid pins and not aligned routing tracks will impact the routing performance and runtime

## settings

* tools -> set mode -> mode setup
  + CMD `setNanoRouteMode`
* types
  + route selected nets only
  + full route
  + initial route
  + search and repair
  + ECO route
* DFM (tools -> set mode -> mode setup -> DFM)
  + prefer to use multicut via
  + either concurrent or post-route opt
* antenna repare (tools -> set mode -> mode setup -> antenna)

## detail control

* route -> NanoRoute -> Specify Attribute
  + CMD `setAttribute routeDesign`
  + to apply for different net types or specific nets
  + to set weight, skip antenna, SI prevention, fix SI post route, etc.

## NanoRoute

* Route -> NanoRoute -> Route
  + CMD `routeDesign`
  + timing driven or SI driven or together
    - `setNanorouteMOde -routeWithTimingDriven true -routeWithSIDriven true`
  + avoid litho problem, or repair litho problem post-route
* or do global and detail routing separately
  + `routeDesign -global`
  + `routeDesign -detail`

## fix antenna

* layer hopping (most common)
* insert diode
  + need to specify diode in LEF
* in-cell diode (rare)
* CMD `setNanoRouteMode -drouteFixAntenna true`

## SI driven routing

* spread wires apart
* re-order nets
* change metal layers

## opt wire for yield

* spread wire: prevent shorts (more space)
  + `setNanoRouteMode -droutePostRouteSpreadWire`
* widen wire: use NDR
  + `setNanoRouteMode -droutePostRouteWidenWire widen`
  + `setNanoRouteMode -droutePostRouteWidenWireRule`
* use `setNanoRouteMode -drouteMinSlackForWireOptimization` to select the candidates for wire opt
* run `routeDesign -wireOpt`

## opt via for yield

* swap with multicut via, either concurrent in detail routing or postroute
  + for 40nm and lower, use post-route opt is better, while reserve space in detail routing stage
* CMD
  + `setNanoRouteMode -dbViaWeight`
  + `setNanoRouteMode -droutePostRouteSwapVia multicut`
  + `routeDesign -viaOpt`
* options
  + critical nets first or non-critical net only

## report

* `reportWire`
* `reportSpecialRoute`
* `reportRoute -ndr`

## NDR (non-default rules) for routing

* can be set to hard rules instead of soft rules by default
* usually for special signal nets, such as clock nets, to have larger width/spacing

## add shielding

* `createShield` or `setAttribute -net xxx -shield xxx` to concurrent add shield during detail routing
* shield might be dropped for sgements because of congestion
* incremental routing: shield will be removed, and recreated at the end of routing

## macro OBS

* `setNanoRouteMode -envMacroObsAsRoutingBlockage`

## routing effort

* `setNanoRouteMode -drouteSignOffEffor`
  + high | medium | low | auto | n
    - n is the number iterations

## sign-off DRC fixing

* `loadViolationReport` and `route_fix_signoff_drc`

## post-route timing opt

* `optDesign -postRoute -setup -hold`
  + if hold time vio remains, use high effor to fix hold `setOptMode -holdFixingEffort high`

# Module 16: debug routing

## flow

1. data prepare
2. customize and mode setup
3. global routing and track assignment
4. detail routing
5. several iterations of search and repair

## global routing

* GCell
* available tracks?
  + even if partially occupied, it's not available
* capacity vs demand
  + with color coding: red/magenta/white is high congestion
  + different with early global routing congestion map
* high metal1 or metal2 congestions indicates that maybe there is pin access problem or cell overlapping problem

## detail ruting

* complete the route based on global routing result
* apply full geometry rules
* prioritize critical nets

## iteration of routing

* global routing first
* detail routing iteration from 0 to 20
  + 20th iteration: search and repair try to fix all the violation, most run-time costly, most powerful. be sure that data is correct before use it
    - search and repair: surgial fix for individual vias and wires, deletion and reroute may be required

## congestion analysis table

* overcon for every metal layer: (demand - supply) per GCell
* TIPS: no magic numbers of congestion to indicates routability
  + < 2%: easy to rout
  + 2% > x > 6%: difficult to route
  + > 6%: high number of DRC violations
* TIPS: check floorplan
  + if buffers are placed on the wrong side of a macro
  + if macro has pin inside, instead of on the boundary
  + placement of macros are important, usually corners near blocks or channels are more congested

## report

* `reportRoute`# Module 17: edit wire

## patch wire

* “RECT” section in the DEF 5.8 file
* to fix min-area violations

## wire editing

* edit -> write -> edit
  + “create special wire” to specify width and spacing
  + advanced tab: can snap to track or pin center
* change via
  + select via -> “shift-n”
    - use “n” or “p” to select the correct via from multiple vias in the same location
* `editCutWire`
* `editChangeWidth`
* use delete icon or “d” -> select/delete form
* create via array
  + add via icon -> “F3” -> edit via form# Module 18: prevent and fix SI problems

## prevent crosstalk

* increase space
* reorder net: long parallel nets are separated
* wire topology control
* change layer: avoid coupling or reduce resistance
* minimize parallel long wires
* shielding
* insert buffer

## fix SI post-route

* ECO -> optimize design
  + post-route, include SI
* require 1 of the 3 libraries: cdb, ECSM-N or CCS-N
* to override default settings
  + `setSIMode -enable_glitch_propogating true -receiver_peak_limit 0.30`

## report

* `report_noise`
* `check_noise`
  + check consistency and completeness of noise models# Module 19: metal fill

## metal fill

* to satisfy min metal density DRC rule
* usually floating, can be tied to VDD or VSS

## how-to

* route -> metal fill -> setup
  + `setMetalFill`
* route -> metal fill -> add
  + `addMetalFill`

## trim metal fill after ECO routing

* to minimize timing violations caused by metal fill
* `trimMetalFill`

## via fill

* to satisfy min cut density
* similar metal fill setup
  + `setViaFill` + `addViaFill`

## flow

* `setViaFill`
* `setMetalFill`
* `addViaFill`
* `addMetalFill`# Module 20: verification

## DRC checks

* use LEF instead of detail layout (GDS)
  + fast TAT
  + not completed
  + connection to pins could have violations

## verify connectivity

* verify -> verify connectivity
  + `verifyConnectivity`

## verify metal density

* verify -> verify metal density
  + `verifyMetalDensity`

## verify geometry

* for 20nm and below, use `set_verify_drc_mode` and `verify_drc`
  + can check diffusion and implant layers
  + can check halo
  + use `set_verify_drc_mode -disable_rules` to disable specific rules
  + can check violations within a cell, like M1 violations
  + can ignore cell blockage DRC

## process antenna

* verify -> verify process antenna
  + `verifyProcessAntenna`

## verify tap cells

* `verifyWellTap`
  + give a list of well tap cells, or get “WELLTAP” from LEF

## verify EM

* verify -> verify AC limit
  + `verifyACLimit`
  + calculate I\_RMS (root mean square current) and compare to the ACCURRENTDENSITY tables in LEF

## verify power wires in power planning stage

* check for unexpected breaks in certain area for certain layers
* `verifyWireGap -wireToWire` to check if gap is smaller than the given number then fails.

## view violation

* tools -> violation browser
  + use “X” to mark violations as false# Module 21: ECO (engineering change orders)

## what is ECO?

* postmask ECO
  + after base layers have been taped out
  + only metal layers can be changed
  + have to use spare cells
* premask ECO
  + before tape out

## settings

* `setEcoMode`
  + `-LEQCheck`
  + `-spreadInverter`
  + `-updateTiming`

## how-to?

* master CMD `ecoDesign`
  + inputs: old design database + new verilog netlist
  + can specify if it's postmask or or not
    - only modify certain metal layers
    - have to give a list of spare cells
* interactive ECO
  + ECO -> interactive ECO
  + add/delete repeater, swap cell
  + `ecoAddRepeater` or `ecoDeleteRepeater`
    - TIPS: disable refine place every step to speed up run time, by `setEcoMode -refinePlace false`
  + `ecoChangeCell`
  + use `-evaluateOnly` to evaluate user-specify cell's impact on timing, or use `-evaluateAll` to evaluate all possible cells, without committing the changes
  + `loadECO` to load a file with all the ECO commands
  + then use `ecoPlace` and `ecoRoute` to do the placement and routing
    - `ecoPlace` distinguish premask and postmask flow
    - `ecoRoute` doesn't support routing of `FIXED` wires, must be changed to `ROUTED` beforehand.

## Innvous + Tempus: signoff ECO

1. Tempus: `signoffTimeDesign`
2. Innovus: `setSignoffOptMode` + `signoffOptDesign`
   * can turn off `-noEcoRoute` for each step, then run `ecoRoute` all together to save runtime
3. Tempus: `signoffTimeDesign`

```
source postroute.inn
# set MMMC views
# set signoff constraints

extractRC

setSignoffOptMode -preStaTcl pre_sta.tcl
setSignoffOptMode -saveEcoOptDb ECO-DB
signoffTimeDesign -reportOnly -outDir before.rpt
setSignoffOptMode -loadEcoOptDb ECO-DB

signoffOptDesign -noEcoRoute -drv
signoffOptDesign -noEcoRoute -setup
signoffOptDesign -noEcoRoute -hold
ecoRoute
extractRC
signoffTimeDesign -reportOnly -outDir after.rpt -noEcoDB
~~~# Module 22: write out

## GDS
- need gds mapping file
- file -> save: gds

## verilog nelist
- `saveNetlist`
    - `-phys` to generate netlist for LVS

## LEF
- `write_lef_abstract` or `lefOut`
    - create obstructions in blockages for signal pins, power and ground pins, vias and PG stripes

## DEF
- `defOut`
    - scan def: `defOutBySection -scanChains -noNets -noComps`

## SDF
- `write_sdf`

## SPEF
- `rcOut -spef`

## save innvous/OA database
- file -> save design# Module 23: challenges of advanced nodes

## Double patterning technology (DPT) or even MPT
- lithography distortion
- common coloring engine (CCE)
    - `colorizeGeometry`
    - can show violations in DPT
- "MASK" keyword in LEF
- additional parameters for mask in GDS also
- color-aware placement and routing
    - impact in all physical aspects
- more restriction at 10nm

## RC diff between layers
- much larger diff in 16n/10nm
- higher, wider, faster

## cell design
- much simpler pin geometry
    - only BAR shape on M1
    - colored by cell designer, INVS cannot change
- `checkDesign` to check std cell and macro
- for hard macros
    - thin pin (only 1 track) need to match routing track color
    - fat pin (more than 1 track) need to be opposite with center routing track to maximize routing resources
    - `snapFPlan -macroPin` to snap macro's pin to right color routing track. Then use `checkFPlan` to check pin snapping
- for large multi-row cells
    - internal connections are modelled as CELL OBS geometries
    - need to align with correct colored tracks while placement

## same length ploy rules
- continuous ploy stripes with the same length must >= N

## implant layer rules: swap Vt cells
- `setPlaceMode`
    - `-checkImplantWidth`
    - `-checkImplantMinArea`
    - `-honorImplantJog`
    - `-honorImplantSpacing`

## boundary cell insertion
- even/odd poly tracks
    - total poly tracks must be even
    - choose different (even/odd) end caps
    - `setEndCapMode` + `addEndCap`

## tap cell
- avoid abutment and overlap
    - `addWellTap -avoidAbutment`
- swap tap cell due to OD spacing violations
    - `swap_well_taps`

## dummy typical critical dimension (DTCD) cells in 10nm
- `fpinsert_physical_cell`

## filler insertion rules
- avoid abutment of certain types of fillers
    - `setFillerMode -avoid_abutment_patterns`

## trim poly layer (TPO)
- marker layer of different channel length cells
- TPO and Vt rules are independent of each other
- `setPlaceMode -honorTPORules true` + `verify_drc`

## 10nm EM prevention
- only widen the driver side wires to avoid EM violations
- report max capacitance violations
    - `set_default_switching_activity` + `propagate_activity`
    - `write_tcf`
    - `read_activity_file`
    - `set_global timing_report_drv_per_frequency_per_input_slew true`
    - `report_constraint -all -drv_violation_type max_capacitance`# Module 24: access database

## dbGet
- `dbGet selected`: objects
    - `dbGet selected.?`: attributes
    - `dbGet selected.?`: attributes and values
- `dbGet [dbGet -p top.nets.isClock 1].name`
    - get all the clock nets

## dbSchema
- all of the available objects and attributes for the specified database object, and description
- `dbSchema inst`

## dbSet

## dbTransform
- takes local coordinates of a cell and return them in context with the global design space

## dbShape
- logical operations of list of shapes

## gift
- <your installation>/<OS>/share/fe/gift/scripts/tcl# Appendix

## pre-route vs post-route timing correlation
- due to via usage
    - detail router use more vias than early global route
    - `setExtractRCMode -extraViasLengthFactor 10`
        -   insert a via every 10x std cell height
- due to layer choice
    - global route prefer to use higher layer by default
- due to SI
    - spread wire to reduce SI impact
    - large diff from pre-route to post-route is caused by SI on clock tree
        - shield the trunk net of clock tree
        - NDR (larger space, larger width)
        - gradually reduce clock uncertainty through the flow
- due to routing topology
    - avoid large fanout net
        - `setOptMode -fixFanoutLoad true`
        - `set_max_fanout N [current_design]`
- due to RC extraction engine
    - Ostrich: correlate RC extraction better
- due to congestion
    - detouring
    - CTS: model clock wiring in pre-CTS stage
        - `setRouteMode -earlyGlobalNumTracksPerClockWire`
        - `setAttribute -net xxx -non_default_rule xxx -shield_net xxx`
        - define CCOPT settings before place_opt_design
        - new feature: `setDesignMode -earlyClockFlow true`
- due to setup issue
    - SI impacts setup timing
    - not completed analysis views

## SDC

## OpenAccess interface
- interoperability between Innovus and Virtuoso
    - common database
    - unified tech
    - back and forth
- top level integrator vs IP designer
    - design intent => interoperable constraints
        - differential pair
        - shielding
        - matched pair
        - NDR
        - blockage
        - ...
- analog to utilize NanoRoute

## pipeline register placement
- long net: timing cannot be solved by buffer insertion, need to pipeline it
- flow
    - floorplan
    - determine if any long nets/groups that need pipeline
    - modify RTL and re-synthesis
- CMD
    - `createPipelineNetGroup`
    - `modifyPipelineNetGroup`
    - `placePipeline`
    - `reportPipeline`

## post exam
1. Q: Chemical and Mechanical polishing is mitigated by the addition of	____? A: Metal fill (not wire widening or multi-cut via)
2. Q: Glitch noise has an impact on ____? A: Functionality (not delay or reliability)
3. Q: The specifyJtag command can only be applied to JTAG cells. Right or wrong? A: Wrong
```
