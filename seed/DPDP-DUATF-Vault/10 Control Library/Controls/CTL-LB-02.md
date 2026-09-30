---
type: control
control_id: CTL-LB-02
title: Data minimisation review
domain: "[[D04 Lawful Basis & Purpose]]"
control_type: Preventive
nature: Manual
frequency: Annual + per change
owner_role: Product / Process Owner
obligations:
- "[[OBL-LB-02]]"
- "[[OBL-CON-01]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.4.1
- 7.4.4
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D04
---

# CTL-LB-02 - Data minimisation review

Field-by-field necessity review of forms, APIs and system fields vs purpose; remove unnecessary fields.

| Attribute | Value |
|---|---|
| Domain | [[D04 Lawful Basis & Purpose]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Annual + per change |
| Owner role | Product / Process Owner |

## Obligations satisfied
- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-CON-01]] Valid consent standard

## Test procedure
Sample 3 forms; check each field has purpose link.

## Evidence
- Minimisation worksheet

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.1, 7.4.4 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-LB-02]]
```
