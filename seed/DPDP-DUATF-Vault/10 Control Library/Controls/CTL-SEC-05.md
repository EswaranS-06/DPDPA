---
type: control
control_id: CTL-SEC-05
title: Privileged access management
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT Security
obligations:
- "[[OBL-SEC-03]]"
- "[[OBL-SEC-04]]"
iso27001_2022:
- '8.2'
- '8.18'
iso27701_2019:
- 6.6.2
nist_csf_2:
- PR.AA-05
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-05 - Privileged access management

Vaulted privileged credentials, session recording for DB/admin access to PD stores.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT Security |

## Obligations satisfied
- [[OBL-SEC-03]] Access control to computer resources
- [[OBL-SEC-04]] Logging, monitoring & review

## Test procedure
Inspect PAM coverage of PD DBs; sample sessions.

## Evidence
- PAM reports

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.2, 8.18 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.6.2 |
| NIST CSF 2.0 | PR.AA-05 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-05]]
```
