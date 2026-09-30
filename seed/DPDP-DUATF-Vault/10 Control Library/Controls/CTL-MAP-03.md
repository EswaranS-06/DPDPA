---
type: control
control_id: CTL-MAP-03
title: System & shadow-data discovery
domain: "[[D03 Data Inventory & Mapping]]"
control_type: Detective
nature: Automated
frequency: Quarterly
owner_role: IT Security
obligations:
- "[[OBL-MAP-01]]"
- "[[OBL-SEC-01]]"
iso27001_2022:
- '5.9'
- '8.12'
iso27701_2019:
- 7.2.8
nist_csf_2:
- ID.AM-07
- DE.CM-09
tags:
- dpdp/control
- dpdp/D03
---

# CTL-MAP-03 - System & shadow-data discovery

Automated/semi-automated discovery of personal data in databases, file shares, email, SaaS, endpoints (DLP/data discovery scans) incl. Excel/WhatsApp/shadow IT.

| Attribute | Value |
|---|---|
| Domain | [[D03 Data Inventory & Mapping]] |
| Type | Detective |
| Nature | Automated |
| Frequency | Quarterly |
| Owner role | IT Security |

## Obligations satisfied
- [[OBL-MAP-01]] Maintain processing activity register
- [[OBL-SEC-01]] Reasonable security safeguards

## Test procedure
Inspect last scan coverage and reconciliation of findings to register.

## Evidence
- Scan reports
- Reconciliation log

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.9, 8.12 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8 |
| NIST CSF 2.0 | ID.AM-07, DE.CM-09 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-MAP-03]]
```
