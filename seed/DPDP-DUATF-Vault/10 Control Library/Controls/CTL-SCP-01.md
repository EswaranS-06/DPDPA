---
type: control
control_id: CTL-SCP-01
title: Applicability & entity profile assessment
domain: "[[D02 Scoping, Applicability & Roles]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: DPO / Legal
obligations:
- "[[OBL-SCP-01]]"
- "[[OBL-SCP-04]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 5.2.1
nist_csf_2:
- GV.OC-01
- GV.OC-03
tags:
- dpdp/control
- dpdp/D02
---

# CTL-SCP-01 - Applicability & entity profile assessment

Documented s.3 applicability, role(s), SDF likelihood, Third Schedule status, children/PwD exposure, sector regulators. Refreshed annually or on business change.

| Attribute | Value |
|---|---|
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | DPO / Legal |

## Obligations satisfied
- [[OBL-SCP-01]] Determine applicability of the Act
- [[OBL-SCP-04]] Monitor SDF notification

## Test procedure
Inspect entity profile; verify it matches business reality (products, geos, user counts).

## Evidence
- Entity Applicability Profile

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 5.2.1 |
| NIST CSF 2.0 | GV.OC-01, GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SCP-01]]
```
