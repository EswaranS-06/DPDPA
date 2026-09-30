---
type: control
control_id: CTL-SEC-03
title: Masking, tokenisation & pseudonymisation
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT / App Owners
obligations:
- "[[OBL-SEC-02]]"
iso27001_2022:
- '8.11'
- '8.33'
iso27701_2019:
- 7.4.5
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-03 - Masking, tokenisation & pseudonymisation

Masking in UIs/reports for non-need roles (e.g. Aadhaar, PAN, card, account); tokenisation for identifiers; masked data in non-prod.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT / App Owners |

## Obligations satisfied
- [[OBL-SEC-02]] Encryption / masking / tokenisation

## Test procedure
Log in as low-privilege role; inspect non-prod data samples.

## Evidence
- Screenshots
- Masking config

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.11, 8.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.5 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-03]]
```
