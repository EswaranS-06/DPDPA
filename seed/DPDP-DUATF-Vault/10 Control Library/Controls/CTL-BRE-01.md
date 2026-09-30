---
type: control
control_id: CTL-BRE-01
title: Incident response plan with DPDP & CERT-In clocks
domain: "[[D10 Breach Management]]"
control_type: Corrective
nature: Manual
frequency: Annual review
owner_role: CISO / DPO
obligations:
- "[[OBL-BRE-01]]"
- "[[OBL-BRE-02]]"
- "[[OBL-BRE-03]]"
- "[[OBL-BRE-04]]"
- "[[LNK-CERT-01]]"
iso27001_2022:
- '5.24'
- '5.25'
- '5.26'
iso27701_2019:
- 6.13.1.1
- 6.13.1.5
nist_csf_2:
- RS.MA-01
- RS.CO-02
tags:
- dpdp/control
- dpdp/D10
---

# CTL-BRE-01 - Incident response plan with DPDP & CERT-In clocks

IR plan with severity matrix, personal-data breach criteria, clocks (CERT-In 6h, Board without delay + 72h, DP without delay, sector regulators), roles and templates.

| Attribute | Value |
|---|---|
| Domain | [[D10 Breach Management]] |
| Type | Corrective |
| Nature | Manual |
| Frequency | Annual review |
| Owner role | CISO / DPO |

## Obligations satisfied
- [[OBL-BRE-01]] Intimate affected Data Principals
- [[OBL-BRE-02]] Initial intimation to Board
- [[OBL-BRE-03]] Detailed report to Board within 72 hours
- [[OBL-BRE-04]] Breach awareness capability
- [[LNK-CERT-01]] CERT-In incident report within 6 hours

## Test procedure
Inspect plan; verify clocks and templates present.

## Evidence
- IR plan
- Templates

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.24, 5.25, 5.26 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.13.1.1, 6.13.1.5 |
| NIST CSF 2.0 | RS.MA-01, RS.CO-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-BRE-01]]
```
