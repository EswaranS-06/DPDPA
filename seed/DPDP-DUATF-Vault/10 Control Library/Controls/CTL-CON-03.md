---
type: control
control_id: CTL-CON-03
title: Withdrawal with comparable ease
domain: "[[D06 Consent Lifecycle]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Per change
owner_role: Product
obligations:
- "[[OBL-CON-04]]"
- "[[OBL-NOT-04]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.4
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-03 - Withdrawal with comparable ease

Withdrawal available on same channel(s) as consent, same or fewer steps; offline equivalents (branch/IVR/SMS keyword).

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Per change |
| Owner role | Product |

## Obligations satisfied
- [[OBL-CON-04]] Withdrawal with comparable ease
- [[OBL-NOT-04]] Means to withdraw, exercise rights, complain

## Test procedure
Count steps give vs withdraw on 3 channels.

## Evidence
- Journey comparison

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.4 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-03]]
```
