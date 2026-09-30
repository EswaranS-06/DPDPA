---
type: control
control_id: CTL-SEC-09
title: Vulnerability & patch management
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Monthly scans; annual VAPT
owner_role: IT Security
obligations:
- "[[OBL-SEC-01]]"
iso27001_2022:
- '8.8'
iso27701_2019:
- 6.9.6
nist_csf_2:
- ID.RA-01
- PR.PS-02
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-09 - Vulnerability & patch management

Scanning and patching of PD-hosting systems; annual VAPT of internet-facing apps.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Monthly scans; annual VAPT |
| Owner role | IT Security |

## Obligations satisfied
- [[OBL-SEC-01]] Reasonable security safeguards

## Test procedure
Inspect scan/VAPT reports and closure.

## Evidence
- Reports
- Closure evidence

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.8 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.9.6 |
| NIST CSF 2.0 | ID.RA-01, PR.PS-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-09]]
```
