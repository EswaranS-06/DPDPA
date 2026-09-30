---
type: control
control_id: CTL-RET-02
title: Automated deletion / anonymisation jobs
domain: "[[D11 Retention & Erasure]]"
control_type: Corrective
nature: Automated
frequency: Scheduled
owner_role: IT / App Owners
obligations:
- "[[OBL-RET-01]]"
- "[[OBL-RGT-04]]"
iso27001_2022:
- '8.10'
iso27701_2019:
- 7.4.5
- 7.4.8
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D11
---

# CTL-RET-02 - Automated deletion / anonymisation jobs

System-level deletion or irreversible anonymisation at retention expiry incl. data lake, backups (expiry), archives, logs.

| Attribute | Value |
|---|---|
| Domain | [[D11 Retention & Erasure]] |
| Type | Corrective |
| Nature | Automated |
| Frequency | Scheduled |
| Owner role | IT / App Owners |

## Obligations satisfied
- [[OBL-RET-01]] Erase at purpose end or withdrawal
- [[OBL-RGT-04]] Right to erasure

## Test procedure
Inspect job configs; query for records past expiry.

## Evidence
- Job logs
- Expiry query

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.10 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.5, 7.4.8 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RET-02]]
```
