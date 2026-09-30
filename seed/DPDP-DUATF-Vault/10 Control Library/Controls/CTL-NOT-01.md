---
type: control
control_id: CTL-NOT-01
title: Rule 3 notice standard & templates
domain: "[[D05 Notice]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Privacy / Legal
obligations:
- "[[OBL-NOT-01]]"
- "[[OBL-NOT-02]]"
- "[[OBL-NOT-03]]"
- "[[OBL-NOT-04]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.2
- 7.3.3
nist_csf_2:
- GV.PO-01
tags:
- dpdp/control
- dpdp/D05
---

# CTL-NOT-01 - Rule 3 notice standard & templates

Master notice template (standalone, itemised data, purposes, goods/services, withdraw/rights/Board complaint links) plus channel variants (web, app, paper, IVR, branch, field agent).

| Attribute | Value |
|---|---|
| Domain | [[D05 Notice]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Privacy / Legal |

## Obligations satisfied
- [[OBL-NOT-01]] Notice with every consent request
- [[OBL-NOT-02]] Notice standalone & plain
- [[OBL-NOT-03]] Itemised data and specified purpose
- [[OBL-NOT-04]] Means to withdraw, exercise rights, complain

## Test procedure
Inspect templates vs Rule 3 checklist; sample live notices on 3 channels.

## Evidence
- Templates
- Screenshots
- Paper forms

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.2, 7.3.3 |
| NIST CSF 2.0 | GV.PO-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-NOT-01]]
```
