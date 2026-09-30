---
type: control
control_id: CTL-GOV-05
title: Privacy by design gate in change/SDLC
domain: "[[D01 Governance & Accountability]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Per change
owner_role: Product / IT Change Board
obligations:
- "[[OBL-GOV-02]]"
- "[[OBL-LB-01]]"
- "[[OBL-LB-02]]"
iso27001_2022:
- '8.25'
- '8.27'
- '5.8'
iso27701_2019:
- 7.2.5
- 7.4.1
nist_csf_2:
- GV.RM-01
- ID.RA-01
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-05 - Privacy by design gate in change/SDLC

New/changed processes, products, systems and vendors pass a privacy review (mini-DPIA) before go-live.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Per change |
| Owner role | Product / IT Change Board |

## Obligations satisfied
- [[OBL-GOV-02]] Technical & organisational measures for compliance
- [[OBL-LB-01]] Specified purpose defined per activity
- [[OBL-LB-02]] Data minimisation for consent

## Test procedure
Sample 5 recent changes; verify privacy review completed pre-go-live.

## Evidence
- Change tickets
- Privacy review forms

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.25, 8.27, 5.8 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.5, 7.4.1 |
| NIST CSF 2.0 | GV.RM-01, ID.RA-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-05]]
```
