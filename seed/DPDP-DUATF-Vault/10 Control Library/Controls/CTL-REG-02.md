---
type: control
control_id: CTL-REG-02
title: Undertaking & appeal tracker
domain: "[[D16 Regulatory Interface]]"
control_type: Detective
nature: Manual
frequency: Monthly
owner_role: Legal
obligations:
- "[[OBL-REG-04]]"
- "[[OBL-REG-05]]"
iso27001_2022:
- '5.31'
iso27701_2019: []
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D16
---

# CTL-REG-02 - Undertaking & appeal tracker

Tracker for voluntary undertakings, Board orders, appeal deadlines (60 days).

| Attribute | Value |
|---|---|
| Domain | [[D16 Regulatory Interface]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Monthly |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-REG-04]] Honour voluntary undertakings
- [[OBL-REG-05]] Appeal within 60 days

## Test procedure
Inspect tracker.

## Evidence
- Tracker

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | - |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-REG-02]]
```
