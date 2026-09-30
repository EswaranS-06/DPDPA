---
type: control
control_id: CTL-SDF-02
title: Annual DPIA & audit cycle
domain: "[[D15 Significant Data Fiduciary]]"
control_type: Detective
nature: Manual
frequency: Annual
owner_role: DPO
obligations:
- "[[OBL-SDF-03]]"
- "[[OBL-SDF-04]]"
- "[[OBL-SDF-05]]"
iso27001_2022:
- '5.35'
iso27701_2019:
- 7.2.5
nist_csf_2:
- ID.RA-01
- GV.OV-02
tags:
- dpdp/control
- dpdp/D15
---

# CTL-SDF-02 - Annual DPIA & audit cycle

DPIA methodology and annual cycle; audit plan; report of significant observations submitted to Board.

| Attribute | Value |
|---|---|
| Domain | [[D15 Significant Data Fiduciary]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Annual |
| Owner role | DPO |

## Obligations satisfied
- [[OBL-SDF-03]] Annual DPIA
- [[OBL-SDF-04]] Annual audit
- [[OBL-SDF-05]] Report significant observations to Board

## Test procedure
Inspect last DPIA/audit and submission.

## Evidence
- DPIA
- Audit report

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.35 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.5 |
| NIST CSF 2.0 | ID.RA-01, GV.OV-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SDF-02]]
```
