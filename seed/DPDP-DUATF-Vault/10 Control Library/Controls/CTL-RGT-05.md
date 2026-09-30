---
type: control
control_id: CTL-RGT-05
title: Erasure request workflow with legal-hold check
domain: "[[D12 Rights & Grievance]]"
control_type: Corrective
nature: IT-dependent manual
frequency: Per request
owner_role: Privacy / IT
obligations:
- "[[OBL-RGT-04]]"
- "[[OBL-RET-01]]"
iso27001_2022:
- '8.10'
iso27701_2019:
- 7.3.6
- 7.4.5
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D12
---

# CTL-RGT-05 - Erasure request workflow with legal-hold check

Erasure fulfilment across systems and processors after checking retention obligations; partial erasure explained to DP.

| Attribute | Value |
|---|---|
| Domain | [[D12 Rights & Grievance]] |
| Type | Corrective |
| Nature | IT-dependent manual |
| Frequency | Per request |
| Owner role | Privacy / IT |

## Obligations satisfied
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RET-01]] Erase at purpose end or withdrawal

## Test procedure
Trace 3 erasures end-to-end.

## Evidence
- Workflow records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.10 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.6, 7.4.5 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RGT-05]]
```
