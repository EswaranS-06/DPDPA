---
type: control
control_id: CTL-RGT-03
title: Requester verification
domain: "[[D12 Rights & Grievance]]"
control_type: Preventive
nature: Manual
frequency: Per request
owner_role: Customer Service
obligations:
- "[[OBL-RGT-07]]"
- "[[OBL-RGT-06]]"
iso27001_2022:
- '5.16'
- '8.5'
iso27701_2019:
- 7.3.9
nist_csf_2:
- PR.AA-02
tags:
- dpdp/control
- dpdp/D12
---

# CTL-RGT-03 - Requester verification

Verify requester using DF-issued identifiers; nominee verification (death certificate/incapacity proof).

| Attribute | Value |
|---|---|
| Domain | [[D12 Rights & Grievance]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per request |
| Owner role | Customer Service |

## Obligations satisfied
- [[OBL-RGT-07]] Requester identification
- [[OBL-RGT-06]] Right to nominate

## Test procedure
Sample 10 requests for verification evidence.

## Evidence
- Verification records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.16, 8.5 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.9 |
| NIST CSF 2.0 | PR.AA-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RGT-03]]
```
