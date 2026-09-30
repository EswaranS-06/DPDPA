---
type: control
control_id: CTL-LB-01
title: Purpose register with lawful basis
domain: "[[D04 Lawful Basis & Purpose]]"
control_type: Directive
nature: Manual
frequency: Per purpose
owner_role: Legal / Privacy
obligations:
- "[[OBL-LB-01]]"
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-LB-05]]"
- "[[OBL-GOV-05]]"
iso27001_2022:
- '5.31'
iso27701_2019:
- 7.2.1
- 7.2.2
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D04
---

# CTL-LB-01 - Purpose register with lawful basis

Each purpose recorded with basis: consent or specific s.7 clause, with justification memo for each s.7 reliance.

| Attribute | Value |
|---|---|
| Domain | [[D04 Lawful Basis & Purpose]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Per purpose |
| Owner role | Legal / Privacy |

## Obligations satisfied
- [[OBL-LB-01]] Specified purpose defined per activity
- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-05]] s.7(f)-(h) emergency use bounded
- [[OBL-GOV-05]] Lawful purpose only

## Test procedure
Sample 10 purposes; verify basis and memo; challenge s.7 reliance.

## Evidence
- Purpose register
- Memos

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.1, 7.2.2 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-LB-01]]
```
