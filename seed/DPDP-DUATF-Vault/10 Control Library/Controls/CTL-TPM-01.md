---
type: control
control_id: CTL-TPM-01
title: Third-party inventory & classification
domain: "[[D13 Processor & Third-Party Management]]"
control_type: Directive
nature: Manual
frequency: Semi-annual
owner_role: Procurement / Privacy
obligations:
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-SCP-02]]"
iso27001_2022:
- '5.19'
- '5.20'
iso27701_2019:
- 7.2.6
- 7.5.4
nist_csf_2:
- GV.SC-04
tags:
- dpdp/control
- dpdp/D13
---

# CTL-TPM-01 - Third-party inventory & classification

Inventory of all third parties receiving PD with role (processor/DF/joint), data, purpose, location, sub-processors, criticality.

| Attribute | Value |
|---|---|
| Domain | [[D13 Processor & Third-Party Management]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Semi-annual |
| Owner role | Procurement / Privacy |

## Obligations satisfied
- [[OBL-PRC-01]] Processor only under valid contract
- [[OBL-PRC-02]] Processor oversight
- [[OBL-SCP-02]] Determine role per processing activity

## Test procedure
Reconcile AP vendor master with inventory.

## Evidence
- Inventory

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.19, 5.20 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.6, 7.5.4 |
| NIST CSF 2.0 | GV.SC-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-TPM-01]]
```
