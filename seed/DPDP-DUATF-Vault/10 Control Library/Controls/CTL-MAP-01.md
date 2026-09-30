---
type: control
control_id: CTL-MAP-01
title: Processing activity register (RoPA)
domain: "[[D03 Data Inventory & Mapping]]"
control_type: Directive
nature: IT-dependent manual
frequency: Semi-annual refresh
owner_role: Process Owners / Privacy
obligations:
- "[[OBL-MAP-01]]"
- "[[OBL-CON-06]]"
iso27001_2022:
- '5.9'
- '5.12'
iso27701_2019:
- 7.2.8
nist_csf_2:
- ID.AM-07
- ID.AM-08
tags:
- dpdp/control
- dpdp/D03
---

# CTL-MAP-01 - Processing activity register (RoPA)

Graph-based register linking department > process > activity > data events > purpose > basis > data elements > systems > recipients > transfers > retention.

| Attribute | Value |
|---|---|
| Domain | [[D03 Data Inventory & Mapping]] |
| Type | Directive |
| Nature | IT-dependent manual |
| Frequency | Semi-annual refresh |
| Owner role | Process Owners / Privacy |

## Obligations satisfied
- [[OBL-MAP-01]] Maintain processing activity register
- [[OBL-CON-06]] Proof of notice and consent

## Test procedure
Select 3 processes; walkthrough and reconcile to register; check completeness of mandatory fields.

## Evidence
- Register export
- Walkthrough notes

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.9, 5.12 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8 |
| NIST CSF 2.0 | ID.AM-07, ID.AM-08 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-MAP-01]]
```
