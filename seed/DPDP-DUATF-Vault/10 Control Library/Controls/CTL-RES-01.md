---
type: control
control_id: CTL-RES-01
title: Research & statistics safeguards
domain: "[[D17 State & Research Processing]]"
control_type: Preventive
nature: Manual
frequency: Per project
owner_role: Research Lead
obligations:
- "[[OBL-RES-01]]"
iso27001_2022:
- '8.11'
iso27701_2019:
- 7.4.5
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D17
---

# CTL-RES-01 - Research & statistics safeguards

Protocol, ethics approval where applicable, de-identification, no DP-specific decisions.

| Attribute | Value |
|---|---|
| Domain | [[D17 State & Research Processing]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per project |
| Owner role | Research Lead |

## Obligations satisfied
- [[OBL-RES-01]] Research/statistics exemption conditions

## Test procedure
Inspect 2 projects.

## Evidence
- Protocols

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.11 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.5 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RES-01]]
```
