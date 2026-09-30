---
type: control
control_id: CTL-NOT-05
title: Legacy customer notice campaign
domain: "[[D05 Notice]]"
control_type: Corrective
nature: IT-dependent manual
frequency: One-time + stragglers
owner_role: Marketing / Privacy
obligations:
- "[[OBL-NOT-06]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.3
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D05
---

# CTL-NOT-05 - Legacy customer notice campaign

Identify pre-commencement consent base; deliver s.5(2) notice via email/SMS/app/branch; log delivery and withdrawals.

| Attribute | Value |
|---|---|
| Domain | [[D05 Notice]] |
| Type | Corrective |
| Nature | IT-dependent manual |
| Frequency | One-time + stragglers |
| Owner role | Marketing / Privacy |

## Obligations satisfied
- [[OBL-NOT-06]] Legacy consent notice

## Test procedure
Inspect campaign coverage %, bounce handling, withdrawal handling.

## Evidence
- Campaign logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.3 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-NOT-05]]
```
