---
type: control
control_id: CTL-GOV-01
title: Privacy programme charter & RACI
domain: "[[D01 Governance & Accountability]]"
control_type: Directive
nature: Manual
frequency: Annual review
owner_role: Accountable Executive
obligations:
- "[[OBL-GOV-01]]"
- "[[OBL-GOV-02]]"
iso27001_2022:
- '5.2'
- '5.4'
iso27701_2019:
- '5.3'
- 6.3.1.1
nist_csf_2:
- GV.RR-01
- GV.RR-02
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-01 - Privacy programme charter & RACI

Board/management-approved DPDP programme charter defining scope, accountable executive, DPO/privacy lead, RACI across business, IT, legal, security.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual review |
| Owner role | Accountable Executive |

## Obligations satisfied
- [[OBL-GOV-01]] Accountability irrespective of processors
- [[OBL-GOV-02]] Technical & organisational measures for compliance

## Test procedure
Inspect charter approval and RACI; interview 3 process owners on awareness of role.

## Evidence
- Charter
- RACI
- Approval minutes

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.2, 5.4 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 5.3, 6.3.1.1 |
| NIST CSF 2.0 | GV.RR-01, GV.RR-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-01]]
```
