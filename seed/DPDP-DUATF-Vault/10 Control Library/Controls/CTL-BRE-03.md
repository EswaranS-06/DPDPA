---
type: control
control_id: CTL-BRE-03
title: DP notification capability
domain: "[[D10 Breach Management]]"
control_type: Corrective
nature: IT-dependent manual
frequency: Tested annually
owner_role: Privacy / Comms
obligations:
- "[[OBL-BRE-01]]"
iso27001_2022:
- '5.26'
iso27701_2019:
- 6.13.1.5
nist_csf_2:
- RS.CO-03
tags:
- dpdp/control
- dpdp/D10
---

# CTL-BRE-03 - DP notification capability

Ability to identify affected principals and notify at scale (email/SMS/app/letters) within hours; content per Rule 7(1).

| Attribute | Value |
|---|---|
| Domain | [[D10 Breach Management]] |
| Type | Corrective |
| Nature | IT-dependent manual |
| Frequency | Tested annually |
| Owner role | Privacy / Comms |

## Obligations satisfied
- [[OBL-BRE-01]] Intimate affected Data Principals

## Test procedure
Tabletop: produce affected list & notice in < 24h.

## Evidence
- Tabletop report

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.26 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.13.1.5 |
| NIST CSF 2.0 | RS.CO-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-BRE-03]]
```
