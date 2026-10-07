---
title: "Hardware Security"
date: 2019-01-07
aliases:
  - "/blog/industry/2019-01-07-hardware-security/"
---

## Keynote panel on RISC-V Summit 2018: opportunities and challenges in security for open source hardware

* Complex systems tend to have bugs, so making it preparatory will make it more secure from attacks. But open source simple systems attract more eyes to review so that it becomes more and more secure over time.
* Military and government customers want secret projects.
* We need to change the way we design system

  + Formal analysis
  + More eyes on it, and keep things open
* Weakness in RISC-V

  + Security committee on the run
  + Simplify designed chip/system to handle secured data, while high performance chip/system to handle non-secured data
  + Resource
    - Right set of expertise of engineers
    - Funding from government
* How ML accelerator changes hardware security? Data flow centric; highly coupled software and hardware; no two chips are alike.

  + Still open question. Question like what will happen if feeding malicious data to the accelerator needs to be answered.
  + Tagged data (low hanging food)
  + Encrypted data (moore???)
  + Explainable AI (big trend)
* Heterogenous design: security weak link

  + Legacy design (cars, military vehicle)
    - Redesign the security parts and replace
  + System-level analysis and compartment the security parts
  + Software-hardware co-design
    - Patchable system, both software(firmware) and hardware

## Interesting concepts

### Row hammer

* Frequently reading/writing adjacent rows in DDR array for lots of times (139K times) will be able to flip the victim row’s content, due to *distrurbance error*.
* In 2015, Google’s Project Zero revealed 2 working **priviledge escalation** exploits based on row hammer effect.

### iOS secure enclave co-processor

* Encrypted RAM
* Hardware RNG (random number generator)
* Handles keys (TouchID, Apple Pay)
* Root key stored in a hard-coded device which cannot be extracted
