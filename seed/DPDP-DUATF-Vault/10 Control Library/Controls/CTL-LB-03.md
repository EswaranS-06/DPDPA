---
type: control
control_id: CTL-LB-03
title: Employee data purpose boundary
domain: "[[D04 Lawful Basis & Purpose]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: HR / Legal
obligations:
- "[[OBL-LB-06]]"
iso27001_2022:
- '6.1'
- '5.34'
iso27701_2019:
- 7.2.2
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D04
---

# CTL-LB-03 - Employee data purpose boundary

HR purpose register separating s.7(i) employment purposes from consent-based (e.g. wellness, marketing, photos on social media).

| Attribute | Value |
|---|---|
| Domain | [[D04 Lawful Basis & Purpose]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | HR / Legal |

## Obligations satisfied
- [[OBL-LB-06]] s.7(i) employment use bounded

## Test procedure
Inspect HR register and employee notice; sample 3 non-core HR uses for consent.

## Evidence
- HR purpose register
- Employee notice

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 6.1, 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.2 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-LB-03]]
```
