---
type: control
control_id: CTL-NOT-02
title: Notice-to-register reconciliation
domain: "[[D05 Notice]]"
control_type: Detective
nature: Manual
frequency: Semi-annual
owner_role: Privacy
obligations:
- "[[OBL-NOT-03]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.2
nist_csf_2:
- ID.IM-01
tags:
- dpdp/control
- dpdp/D05
---

# CTL-NOT-02 - Notice-to-register reconciliation

Each notice's itemised data and purposes reconciled to the purpose register; drift flagged on change.

| Attribute | Value |
|---|---|
| Domain | [[D05 Notice]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Semi-annual |
| Owner role | Privacy |

## Obligations satisfied
- [[OBL-NOT-03]] Itemised data and specified purpose

## Test procedure
Reconcile 3 notices with register.

## Evidence
- Reconciliation sheet

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.2 |
| NIST CSF 2.0 | ID.IM-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-NOT-02]]
```
