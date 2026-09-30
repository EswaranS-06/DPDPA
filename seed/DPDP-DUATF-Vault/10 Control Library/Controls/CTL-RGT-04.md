---
type: control
control_id: CTL-RGT-04
title: Access-request data assembly
domain: "[[D12 Rights & Grievance]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Per request
owner_role: IT / Privacy
obligations:
- "[[OBL-RGT-02]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.8
- 7.5.4
nist_csf_2:
- ID.AM-07
tags:
- dpdp/control
- dpdp/D12
---

# CTL-RGT-04 - Access-request data assembly

Ability to compile summary of data, processing and recipients (DFs & processors) per principal across systems (identity resolution across systems).

| Attribute | Value |
|---|---|
| Domain | [[D12 Rights & Grievance]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Per request |
| Owner role | IT / Privacy |

## Obligations satisfied
- [[OBL-RGT-02]] Right to access

## Test procedure
Run test access request; check completeness vs register.

## Evidence
- Output sample

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.8, 7.5.4 |
| NIST CSF 2.0 | ID.AM-07 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RGT-04]]
```
