---
type: control
control_id: CTL-CMO-01
title: Consent Manager registration & governance
domain: "[[D18 Consent Manager Operations]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Company Secretary
obligations:
- "[[OBL-CMO-01]]"
- "[[OBL-CMO-05]]"
- "[[OBL-CMO-06]]"
iso27001_2022:
- '5.31'
iso27701_2019: []
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D18
---

# CTL-CMO-01 - Consent Manager registration & governance

Registration file, net worth monitoring, fit & proper checks, COI policy, disclosures, change-of-control approvals.

| Attribute | Value |
|---|---|
| Domain | [[D18 Consent Manager Operations]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Company Secretary |

## Obligations satisfied
- [[OBL-CMO-01]] Register as Consent Manager
- [[OBL-CMO-05]] Conflict of interest & transparency
- [[OBL-CMO-06]] Audit & change of control

## Test procedure
Inspect registration & disclosures.

## Evidence
- Registration
- Disclosures

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | - |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CMO-01]]
```
