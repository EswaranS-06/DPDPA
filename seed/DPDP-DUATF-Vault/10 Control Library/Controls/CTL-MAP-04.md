---
type: control
control_id: CTL-MAP-04
title: Data element catalogue & classification
domain: "[[D03 Data Inventory & Mapping]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: Data Governance
obligations:
- "[[OBL-MAP-01]]"
- "[[OBL-LB-02]]"
iso27001_2022:
- '5.12'
- '5.13'
iso27701_2019:
- 7.4.1
nist_csf_2:
- ID.AM-07
tags:
- dpdp/control
- dpdp/D03
---

# CTL-MAP-04 - Data element catalogue & classification

Standard catalogue of data elements with category and context flags (health, financial, biometric, children, gov ID).

| Attribute | Value |
|---|---|
| Domain | [[D03 Data Inventory & Mapping]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | Data Governance |

## Obligations satisfied
- [[OBL-MAP-01]] Maintain processing activity register
- [[OBL-LB-02]] Data minimisation for consent

## Test procedure
Sample 20 fields from 2 systems; verify mapped to catalogue.

## Evidence
- Catalogue
- Mapping

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.12, 5.13 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.1 |
| NIST CSF 2.0 | ID.AM-07 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-MAP-04]]
```
