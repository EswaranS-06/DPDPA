---
type: control
control_id: CTL-CON-04
title: Withdrawal propagation
domain: "[[D06 Consent Lifecycle]]"
control_type: Corrective
nature: Automated
frequency: Continuous + monthly recon
owner_role: IT / Data Engineering
obligations:
- "[[OBL-CON-05]]"
- "[[OBL-PRC-03]]"
iso27001_2022:
- '5.14'
iso27701_2019:
- 7.3.4
- 7.3.7
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-04 - Withdrawal propagation

Withdrawal events propagate to all downstream systems and processors within defined SLA (e.g. 48-72h) with reconciliation.

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Corrective |
| Nature | Automated |
| Frequency | Continuous + monthly recon |
| Owner role | IT / Data Engineering |

## Obligations satisfied
- [[OBL-CON-05]] Cease processing after withdrawal
- [[OBL-PRC-03]] Flow-down withdrawal & erasure

## Test procedure
Withdraw test consent; trace to CRM, marketing, data lake, processors.

## Evidence
- Propagation logs
- Recon report

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.4, 7.3.7 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-04]]
```
