---
type: control
control_id: CTL-GOV-06
title: Management reporting & KPIs
domain: "[[D01 Governance & Accountability]]"
control_type: Detective
nature: Manual
frequency: Quarterly
owner_role: DPO / Privacy Lead
obligations:
- "[[OBL-GOV-01]]"
iso27001_2022:
- '5.35'
- '9.3'
iso27701_2019:
- '5.6'
nist_csf_2:
- GV.OV-01
- GV.OV-03
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-06 - Management reporting & KPIs

Quarterly privacy dashboard to management/board: readiness %, open findings, rights SLA, breaches, vendor coverage.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Quarterly |
| Owner role | DPO / Privacy Lead |

## Obligations satisfied
- [[OBL-GOV-01]] Accountability irrespective of processors

## Test procedure
Inspect last 2 quarterly reports and minutes.

## Evidence
- Dashboards
- Minutes

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.35, 9.3 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 5.6 |
| NIST CSF 2.0 | GV.OV-01, GV.OV-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-06]]
```
