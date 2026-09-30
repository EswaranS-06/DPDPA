---
type: control
control_id: CTL-SEC-01
title: ISMS & security risk assessment
domain: "[[D09 Security Safeguards]]"
control_type: Directive
nature: Manual
frequency: Annual
owner_role: CISO
obligations:
- "[[OBL-SEC-01]]"
- "[[OBL-SEC-08]]"
- "[[LNK-SPDI-01]]"
iso27001_2022:
- '5.1'
- 6.1.2
- '8.2'
iso27701_2019:
- '6.2'
nist_csf_2:
- GV.RM-01
- ID.RA-01
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-01 - ISMS & security risk assessment

ISMS covering personal-data systems; annual risk assessment with personal data impact.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Directive |
| Nature | Manual |
| Frequency | Annual |
| Owner role | CISO |

## Obligations satisfied
- [[OBL-SEC-01]] Reasonable security safeguards
- [[OBL-SEC-08]] TOMs for security observance
- [[LNK-SPDI-01]] SPDI Rules 2011 (until Phase 3)

## Test procedure
Inspect ISMS scope includes all PD systems; risk register.

## Evidence
- ISMS scope
- Risk register
- ISO cert

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.1, 6.1.2, 8.2 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.2 |
| NIST CSF 2.0 | GV.RM-01, ID.RA-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-01]]
```
