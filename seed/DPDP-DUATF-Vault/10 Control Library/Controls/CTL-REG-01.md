---
type: control
control_id: CTL-REG-01
title: Regulator & Government request handling
domain: "[[D16 Regulatory Interface]]"
control_type: Directive
nature: Manual
frequency: Per request
owner_role: Legal
obligations:
- "[[OBL-REG-01]]"
- "[[OBL-REG-02]]"
- "[[OBL-REG-03]]"
- "[[OBL-LB-04]]"
iso27001_2022:
- '5.5'
- '5.31'
iso27701_2019:
- 7.5.4
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D16
---

# CTL-REG-01 - Regulator & Government request handling

Register and SOP for Board inquiries, Govt info calls (R23), law-enforcement requests, confidentiality directions and response timelines.

| Attribute | Value |
|---|---|
| Domain | [[D16 Regulatory Interface]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Per request |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-REG-01]] Furnish information to Central Govt
- [[OBL-REG-02]] Confidentiality of Govt requests
- [[OBL-REG-03]] Cooperate with Board inquiry & directions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified

## Test procedure
Inspect register and sample responses.

## Evidence
- Request register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.5, 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.5.4 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-REG-01]]
```
