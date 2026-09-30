---
type: control
control_id: CTL-SEC-12
title: Secure SDLC & non-prod data
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: IT-dependent manual
frequency: Per release
owner_role: Engineering
obligations:
- "[[OBL-SEC-01]]"
- "[[OBL-SEC-02]]"
iso27001_2022:
- '8.25'
- '8.28'
- '8.31'
- '8.33'
iso27701_2019:
- 6.11.3.1
nist_csf_2:
- PR.PS-06
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-12 - Secure SDLC & non-prod data

Secure coding, privacy test cases, no production PD in dev/test without masking.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | IT-dependent manual |
| Frequency | Per release |
| Owner role | Engineering |

## Obligations satisfied
- [[OBL-SEC-01]] Reasonable security safeguards
- [[OBL-SEC-02]] Encryption / masking / tokenisation

## Test procedure
Sample releases; inspect test data sources.

## Evidence
- SDLC artefacts

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.25, 8.28, 8.31, 8.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.11.3.1 |
| NIST CSF 2.0 | PR.PS-06 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-12]]
```
