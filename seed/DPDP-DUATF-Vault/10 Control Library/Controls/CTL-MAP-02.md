---
type: control
control_id: CTL-MAP-02
title: Data flow diagrams incl. digitisation points
domain: "[[D03 Data Inventory & Mapping]]"
control_type: Directive
nature: Manual
frequency: Semi-annual
owner_role: Process Owners / Architecture
obligations:
- "[[OBL-MAP-01]]"
- "[[OBL-MAP-02]]"
iso27001_2022:
- '5.9'
- '5.14'
iso27701_2019:
- 7.2.8
- 7.5.3
nist_csf_2:
- ID.AM-03
tags:
- dpdp/control
- dpdp/D03
---

# CTL-MAP-02 - Data flow diagrams incl. digitisation points

Level-1 data flows per process showing entry channels, digitisation, systems, internal/external recipients and cross-border hops.

| Attribute | Value |
|---|---|
| Domain | [[D03 Data Inventory & Mapping]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Semi-annual |
| Owner role | Process Owners / Architecture |

## Obligations satisfied
- [[OBL-MAP-01]] Maintain processing activity register
- [[OBL-MAP-02]] Identify digitised non-digital data

## Test procedure
Compare DFD to system integration list and firewall/API gateway rules.

## Evidence
- DFDs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.9, 5.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8, 7.5.3 |
| NIST CSF 2.0 | ID.AM-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-MAP-02]]
```
