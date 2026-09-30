---
type: control
control_id: CTL-DQ-01
title: Data quality rules for decisioning & disclosures
domain: "[[D08 Data Quality]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: Data Governance
obligations:
- "[[OBL-DQ-01]]"
iso27001_2022:
- '8.28'
iso27701_2019:
- 7.4.3
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D08
---

# CTL-DQ-01 - Data quality rules for decisioning & disclosures

Validation, deduplication and reconciliation for data used in decisions (credit, eligibility, hiring, claims) or disclosed to other DFs (bureaus, regulators, partners).

| Attribute | Value |
|---|---|
| Domain | [[D08 Data Quality]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | Data Governance |

## Obligations satisfied
- [[OBL-DQ-01]] Accuracy for decisions & disclosures

## Test procedure
Inspect DQ rules & exception reports for 2 decision systems.

## Evidence
- DQ rules
- Exception reports

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.28 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.3 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-DQ-01]]
```
