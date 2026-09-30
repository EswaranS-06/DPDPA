---
type: control
control_id: CTL-RET-01
title: Reconciled retention schedule
domain: "[[D11 Retention & Erasure]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Legal / Records
obligations:
- "[[OBL-RET-01]]"
- "[[OBL-RET-05]]"
- "[[OBL-RET-06]]"
iso27001_2022:
- '5.33'
iso27701_2019:
- 7.4.7
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D11
---

# CTL-RET-01 - Reconciled retention schedule

Retention schedule per record type/purpose citing DPDP (purpose end, 1-yr floor, Sch3) and sector/tax/labour laws; legal hold process.

| Attribute | Value |
|---|---|
| Domain | [[D11 Retention & Erasure]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Legal / Records |

## Obligations satisfied
- [[OBL-RET-01]] Erase at purpose end or withdrawal
- [[OBL-RET-05]] 1-year floor for data, traffic data & logs
- [[OBL-RET-06]] Reconciled retention schedule

## Test procedure
Inspect schedule; sample 5 record types for legal basis.

## Evidence
- Retention schedule

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.7 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-RET-01]]
```
