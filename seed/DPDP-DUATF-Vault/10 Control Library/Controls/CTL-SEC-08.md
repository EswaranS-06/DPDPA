---
type: control
control_id: CTL-SEC-08
title: Backup & restore
domain: "[[D09 Security Safeguards]]"
control_type: Corrective
nature: Automated
frequency: Per schedule; restore test quarterly
owner_role: IT Ops
obligations:
- "[[OBL-SEC-05]]"
iso27001_2022:
- '8.13'
- '5.30'
iso27701_2019:
- 6.9.3
nist_csf_2:
- PR.DS-11
- RC.RP-03
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-08 - Backup & restore

Backups of PD systems, encrypted, tested restores, DR aligned to RTO/RPO.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Corrective |
| Nature | Automated |
| Frequency | Per schedule; restore test quarterly |
| Owner role | IT Ops |

## Obligations satisfied
- [[OBL-SEC-05]] Continuity (backups)

## Test procedure
Inspect backup jobs and last restore test.

## Evidence
- Backup reports
- Restore tests

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.13, 5.30 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.9.3 |
| NIST CSF 2.0 | PR.DS-11, RC.RP-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-08]]
```
