---
type: control
control_id: CTL-LB-04
title: Secondary-use & repurposing control
domain: "[[D04 Lawful Basis & Purpose]]"
control_type: Preventive
nature: Manual
frequency: Per request
owner_role: Privacy / Data Governance
obligations:
- "[[OBL-LB-01]]"
- "[[OBL-CON-01]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.4.2
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D04
---

# CTL-LB-04 - Secondary-use & repurposing control

Any new use of existing data (analytics, AI training, cross-sell, sharing with group) requires purpose-compatibility review and new basis if needed.

| Attribute | Value |
|---|---|
| Domain | [[D04 Lawful Basis & Purpose]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per request |
| Owner role | Privacy / Data Governance |

## Obligations satisfied
- [[OBL-LB-01]] Specified purpose defined per activity
- [[OBL-CON-01]] Valid consent standard

## Test procedure
Sample analytics/AI projects; verify review.

## Evidence
- Review records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.2 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-LB-04]]
```
