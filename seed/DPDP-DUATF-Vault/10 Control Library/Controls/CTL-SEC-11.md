---
type: control
control_id: CTL-SEC-11
title: Physical & paper record security
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Manual
frequency: Continuous
owner_role: Admin / Facilities
obligations:
- "[[OBL-SEC-01]]"
iso27001_2022:
- '7.1'
- '7.2'
- '7.10'
- '7.14'
iso27701_2019:
- '6.8'
nist_csf_2:
- PR.AA-06
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-11 - Physical & paper record security

Secure storage, access registers and shredding for paper forms/files before and after digitisation.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Continuous |
| Owner role | Admin / Facilities |

## Obligations satisfied
- [[OBL-SEC-01]] Reasonable security safeguards

## Test procedure
Site walkthrough; inspect storage and shredding logs.

## Evidence
- Walkthrough notes
- Shredding certificates

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 7.1, 7.2, 7.10, 7.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.8 |
| NIST CSF 2.0 | PR.AA-06 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-11]]
```
