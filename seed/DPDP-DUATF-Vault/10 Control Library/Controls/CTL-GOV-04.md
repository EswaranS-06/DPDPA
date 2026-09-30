---
type: control
control_id: CTL-GOV-04
title: Privacy awareness & role-based training
domain: "[[D01 Governance & Accountability]]"
control_type: Preventive
nature: Manual
frequency: Annual
owner_role: HR / Privacy Lead
obligations:
- "[[OBL-GOV-02]]"
- "[[OBL-SEC-08]]"
iso27001_2022:
- '6.3'
iso27701_2019:
- 6.4.2.2
nist_csf_2:
- PR.AT-01
- PR.AT-02
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-04 - Privacy awareness & role-based training

Induction + annual training for all staff; role-based modules for front-line collection staff, call centre, HR, developers, marketing.

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | HR / Privacy Lead |

## Obligations satisfied
- [[OBL-GOV-02]] Technical & organisational measures for compliance
- [[OBL-SEC-08]] TOMs for security observance

## Test procedure
Inspect completion rates (target >=95%); sample content against DPDP.

## Evidence
- LMS report
- Training content

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 6.3 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.4.2.2 |
| NIST CSF 2.0 | PR.AT-01, PR.AT-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-04]]
```
