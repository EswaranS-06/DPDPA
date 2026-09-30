---
type: control
control_id: CTL-SCP-02
title: Role determination per activity & contract
domain: "[[D02 Scoping, Applicability & Roles]]"
control_type: Directive
nature: Manual
frequency: Per activity/contract
owner_role: Legal / Privacy
obligations:
- "[[OBL-SCP-02]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.7
- 8.2.1
nist_csf_2:
- GV.OC-02
tags:
- dpdp/control
- dpdp/D02
---

# CTL-SCP-02 - Role determination per activity & contract

For each activity and each third-party relationship record DF/processor/joint-DF status with rationale.

| Attribute | Value |
|---|---|
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Per activity/contract |
| Owner role | Legal / Privacy |

## Obligations satisfied
- [[OBL-SCP-02]] Determine role per processing activity

## Test procedure
Sample 10 vendor contracts; compare role recorded vs actual control of purpose/means.

## Evidence
- Role register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.7, 8.2.1 |
| NIST CSF 2.0 | GV.OC-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SCP-02]]
```
