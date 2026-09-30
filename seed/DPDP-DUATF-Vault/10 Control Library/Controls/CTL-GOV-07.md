---
type: control
control_id: CTL-GOV-07
title: Lawful-purpose screening
domain: "[[D01 Governance & Accountability]]"
control_type: Preventive
nature: Manual
frequency: Per new purpose
owner_role: Legal
obligations:
- "[[OBL-GOV-05]]"
- "[[OBL-LB-01]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.1
- 7.2.2
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D01
---

# CTL-GOV-07 - Lawful-purpose screening

Legal screen that each purpose is not forbidden by law and has a basis (consent or s.7).

| Attribute | Value |
|---|---|
| Domain | [[D01 Governance & Accountability]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per new purpose |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-GOV-05]] Lawful purpose only
- [[OBL-LB-01]] Specified purpose defined per activity

## Test procedure
Sample purposes; verify legal screen recorded.

## Evidence
- Purpose register entries

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.1, 7.2.2 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-GOV-07]]
```
