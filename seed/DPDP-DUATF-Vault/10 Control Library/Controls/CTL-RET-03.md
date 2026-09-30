---
type: control
control_id: CTL-RET-03
title: Third Schedule inactivity engine
domain: "[[D11 Retention & Erasure]]"
control_type: Corrective
nature: Automated
frequency: Daily
owner_role: Product / IT
obligations:
- "[[OBL-RET-03]]"
- "[[OBL-RET-04]]"
iso27001_2022:
- '8.10'
iso27701_2019:
- 7.4.7
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D11
---

# CTL-RET-03 - Third Schedule inactivity engine

Track last-approach date; 48h pre-erasure notice; erase at 3 years (exclude account access & wallet tokens).

| Attribute | Value |
|---|---|
| Domain | [[D11 Retention & Erasure]] |
| Type | Corrective |
| Nature | Automated |
| Frequency | Daily |
| Owner role | Product / IT |

## Obligations satisfied
- [[OBL-RET-03]] Third Schedule inactivity erasure
- [[OBL-RET-04]] 48-hour pre-erasure intimation

## Test procedure
Inspect logic and sample notices.

## Evidence
- Job config
- Notice logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.10 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.7 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RET-03]]
```
