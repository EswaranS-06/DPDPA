---
type: control
control_id: CTL-BRE-04
title: Breach tabletop exercises
domain: "[[D10 Breach Management]]"
control_type: Detective
nature: Manual
frequency: Annual
owner_role: CISO / DPO
obligations:
- "[[OBL-BRE-04]]"
iso27001_2022:
- '5.24'
- '5.30'
iso27701_2019:
- 6.13.1.1
nist_csf_2:
- ID.IM-02
- RS.MA-01
tags:
- dpdp/control
- dpdp/D10
---

# CTL-BRE-04 - Breach tabletop exercises

Annual tabletop incl. processor-originated breach and ransomware scenario.

| Attribute | Value |
|---|---|
| Domain | [[D10 Breach Management]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Annual |
| Owner role | CISO / DPO |

## Obligations satisfied
- [[OBL-BRE-04]] Breach awareness capability

## Test procedure
Inspect exercise report and actions.

## Evidence
- Exercise reports

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.24, 5.30 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.13.1.1 |
| NIST CSF 2.0 | ID.IM-02, RS.MA-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-BRE-04]]
```
