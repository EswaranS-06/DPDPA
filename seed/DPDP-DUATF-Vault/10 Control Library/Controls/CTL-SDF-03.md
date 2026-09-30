---
type: control
control_id: CTL-SDF-03
title: Algorithm inventory & risk assessment
domain: "[[D15 Significant Data Fiduciary]]"
control_type: Detective
nature: Manual
frequency: Annual + per model change
owner_role: Data Science / Risk
obligations:
- "[[OBL-SDF-06]]"
iso27001_2022:
- '5.8'
iso27701_2019:
- 7.3.10
nist_csf_2:
- ID.RA-04
tags:
- dpdp/control
- dpdp/D15
---

# CTL-SDF-03 - Algorithm inventory & risk assessment

Inventory of algorithms/AI models touching PD (ranking, recommendation, moderation, credit, fraud) with risk assessment of impact on DP rights.

| Attribute | Value |
|---|---|
| Domain | [[D15 Significant Data Fiduciary]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Annual + per model change |
| Owner role | Data Science / Risk |

## Obligations satisfied
- [[OBL-SDF-06]] Algorithmic due diligence

## Test procedure
Sample 3 models for assessments.

## Evidence
- Model inventory
- Assessments

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.8 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.10 |
| NIST CSF 2.0 | ID.RA-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SDF-03]]
```
