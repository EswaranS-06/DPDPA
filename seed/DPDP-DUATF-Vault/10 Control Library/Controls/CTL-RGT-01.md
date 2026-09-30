---
type: control
control_id: CTL-RGT-01
title: Rights & grievance intake channels
domain: "[[D12 Rights & Grievance]]"
control_type: Directive
nature: IT-dependent manual
frequency: Continuous
owner_role: Customer Service / DPO
obligations:
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-05]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.9
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D12
---

# CTL-RGT-01 - Rights & grievance intake channels

Published channels (web form, app, email, branch, call centre) with required identifiers; all route to a single tracked queue.

| Attribute | Value |
|---|---|
| Domain | [[D12 Rights & Grievance]] |
| Type | Directive |
| Nature | IT-dependent manual |
| Frequency | Continuous |
| Owner role | Customer Service / DPO |

## Obligations satisfied
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-RGT-05]] Grievance redressal within 90 days

## Test procedure
Submit test requests on 2 channels; verify logged.

## Evidence
- Rights page
- Queue

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.9 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RGT-01]]
```
