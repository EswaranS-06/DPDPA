---
type: control
control_id: CTL-DQ-02
title: Correction propagation
domain: "[[D08 Data Quality]]"
control_type: Corrective
nature: IT-dependent manual
frequency: Per request
owner_role: Ops / IT
obligations:
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-03]]"
iso27001_2022:
- '5.14'
iso27701_2019:
- 7.3.7
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D08
---

# CTL-DQ-02 - Correction propagation

Corrections made on DP request propagate to systems and recipients who received the data.

| Attribute | Value |
|---|---|
| Domain | [[D08 Data Quality]] |
| Type | Corrective |
| Nature | IT-dependent manual |
| Frequency | Per request |
| Owner role | Ops / IT |

## Obligations satisfied
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-03]] Right to correction, completion, updating

## Test procedure
Trace 3 corrections downstream.

## Evidence
- Change logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.7 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-DQ-02]]
```
