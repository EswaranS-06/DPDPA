---
type: control
control_id: CTL-SEC-14
title: Endpoint & mobile device security
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT
obligations:
- "[[OBL-SEC-02]]"
- "[[OBL-SEC-03]]"
iso27001_2022:
- '8.1'
- '8.7'
iso27701_2019:
- 6.3.2
nist_csf_2:
- PR.PS-01
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-14 - Endpoint & mobile device security

Disk encryption, EDR, MDM for devices handling PD incl. field-agent tablets and BYOD.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT |

## Obligations satisfied
- [[OBL-SEC-02]] Encryption / masking / tokenisation
- [[OBL-SEC-03]] Access control to computer resources

## Test procedure
Inspect MDM/EDR coverage report.

## Evidence
- Coverage reports

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.1, 8.7 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.3.2 |
| NIST CSF 2.0 | PR.PS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-14]]
```
