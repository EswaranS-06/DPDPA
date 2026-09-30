---
type: control
control_id: CTL-CHD-04
title: Fourth Schedule exemption scoping
domain: "[[D07 Children & Persons with Disability]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Legal
obligations:
- "[[OBL-CHD-06]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.2
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D07
---

# CTL-CHD-04 - Fourth Schedule exemption scoping

Where exemption relied on, processing limited to Sch4 condition; documented in exemption register.

| Attribute | Value |
|---|---|
| Domain | [[D07 Children & Persons with Disability]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-CHD-06]] Fourth Schedule exemption conditions

## Test procedure
Compare actual use vs Sch4 condition.

## Evidence
- Exemption register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.2 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CHD-04]]
```
