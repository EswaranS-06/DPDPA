---
type: control
control_id: CTL-SCP-03
title: Exemption register
domain: "[[D02 Scoping, Applicability & Roles]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Legal
obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-CHD-06]]"
- "[[OBL-RES-01]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.2
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D02
---

# CTL-SCP-03 - Exemption register

Register of s.7/s.17/Sch4 reliance with clause, scope, residual obligations, legal owner and review date.

| Attribute | Value |
|---|---|
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-SCP-03]] Document and justify exemptions
- [[OBL-CHD-06]] Fourth Schedule exemption conditions
- [[OBL-RES-01]] Research/statistics exemption conditions

## Test procedure
Inspect entries; test that residual obligations (s.8(1),(5)) are still covered.

## Evidence
- Exemption register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.2 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SCP-03]]
```
