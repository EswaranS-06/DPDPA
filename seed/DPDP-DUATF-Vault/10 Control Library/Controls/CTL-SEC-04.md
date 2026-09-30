---
type: control
control_id: CTL-SEC-04
title: Identity & access management
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Quarterly review
owner_role: IT / System Owners
obligations:
- "[[OBL-SEC-03]]"
iso27001_2022:
- '5.15'
- '5.16'
- '5.18'
- '8.2'
- '8.3'
- '8.5'
iso27701_2019:
- '6.6'
nist_csf_2:
- PR.AA-01
- PR.AA-05
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-04 - Identity & access management

RBAC/least privilege, MFA for remote and privileged access, joiner-mover-leaver, quarterly access reviews for PD systems.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Quarterly review |
| Owner role | IT / System Owners |

## Obligations satisfied
- [[OBL-SEC-03]] Access control to computer resources

## Test procedure
Sample leavers and movers; inspect last access review; MFA coverage.

## Evidence
- Access reviews
- JML tickets
- MFA report

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.15, 5.16, 5.18, 8.2, 8.3, 8.5 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.6 |
| NIST CSF 2.0 | PR.AA-01, PR.AA-05 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-04]]
```
