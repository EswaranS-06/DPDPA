---
type: control
control_id: CTL-RET-05
title: Paper record disposal
domain: "[[D11 Retention & Erasure]]"
control_type: Corrective
nature: Manual
frequency: Scheduled
owner_role: Admin
obligations:
- "[[OBL-RET-01]]"
iso27001_2022:
- '7.14'
iso27701_2019:
- 7.4.8
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D11
---

# CTL-RET-05 - Paper record disposal

Paper forms destroyed after digitisation/retention per schedule with shredding records.

| Attribute | Value |
|---|---|
| Domain | [[D11 Retention & Erasure]] |
| Type | Corrective |
| Nature | Manual |
| Frequency | Scheduled |
| Owner role | Admin |

## Obligations satisfied
- [[OBL-RET-01]] Erase at purpose end or withdrawal

## Test procedure
Inspect shredding logs vs schedule.

## Evidence
- Logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 7.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.8 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RET-05]]
```
