---
type: control
control_id: CTL-SEC-10
title: DLP & data exfiltration controls
domain: "[[D09 Security Safeguards]]"
control_type: Detective
nature: Automated
frequency: Continuous
owner_role: IT Security
obligations:
- "[[OBL-SEC-01]]"
- "[[OBL-SEC-04]]"
iso27001_2022:
- '8.12'
iso27701_2019:
- 6.5.3
nist_csf_2:
- PR.DS-01
- DE.CM-01
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-10 - DLP & data exfiltration controls

DLP on email/web/endpoint/USB for PD patterns (Aadhaar, PAN, card, health terms); block/alert.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Detective |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT Security |

## Obligations satisfied
- [[OBL-SEC-01]] Reasonable security safeguards
- [[OBL-SEC-04]] Logging, monitoring & review

## Test procedure
Inspect policies; test with dummy data.

## Evidence
- DLP policies
- Incidents

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.12 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.5.3 |
| NIST CSF 2.0 | PR.DS-01, DE.CM-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-10]]
```
