---
type: control
control_id: CTL-BRE-02
title: Breach register & decision log
domain: "[[D10 Breach Management]]"
control_type: Detective
nature: Manual
frequency: Per incident
owner_role: DPO
obligations:
- "[[OBL-BRE-01]]"
- "[[OBL-BRE-02]]"
- "[[OBL-BRE-03]]"
iso27001_2022:
- '5.27'
- '5.28'
iso27701_2019:
- 6.13.1.5
nist_csf_2:
- RS.AN-03
- RS.MA-02
tags:
- dpdp/control
- dpdp/D10
---

# CTL-BRE-02 - Breach register & decision log

Log of all incidents with PD impact assessment, awareness timestamp, notification decisions and timestamps per regulator/DP.

| Attribute | Value |
|---|---|
| Domain | [[D10 Breach Management]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Per incident |
| Owner role | DPO |

## Obligations satisfied
- [[OBL-BRE-01]] Intimate affected Data Principals
- [[OBL-BRE-02]] Initial intimation to Board
- [[OBL-BRE-03]] Detailed report to Board within 72 hours

## Test procedure
Sample incidents; verify timestamps vs clocks.

## Evidence
- Breach register

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.27, 5.28 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.13.1.5 |
| NIST CSF 2.0 | RS.AN-03, RS.MA-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-BRE-02]]
```
