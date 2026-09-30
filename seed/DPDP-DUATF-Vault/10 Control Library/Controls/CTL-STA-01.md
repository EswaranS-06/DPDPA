---
type: control
control_id: CTL-STA-01
title: Second Schedule compliance for State schemes
domain: "[[D17 State & Research Processing]]"
control_type: Directive
nature: Manual
frequency: Per scheme
owner_role: Department Head / Nodal Officer
obligations:
- "[[OBL-STA-01]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.1
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D17
---

# CTL-STA-01 - Second Schedule compliance for State schemes

Scheme-wise note on lawful basis, necessity, accuracy, retention, security, intimation and accountability.

| Attribute | Value |
|---|---|
| Domain | [[D17 State & Research Processing]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Per scheme |
| Owner role | Department Head / Nodal Officer |

## Obligations satisfied
- [[OBL-STA-01]] State benefit processing per Second Schedule

## Test procedure
Inspect 2 schemes.

## Evidence
- Scheme notes

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.1 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-STA-01]]
```
