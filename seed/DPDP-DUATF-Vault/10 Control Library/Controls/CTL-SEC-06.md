---
type: control
control_id: CTL-SEC-06
title: Logging & monitoring of personal data access
domain: "[[D09 Security Safeguards]]"
control_type: Detective
nature: Automated
frequency: Continuous
owner_role: SOC
obligations:
- "[[OBL-SEC-04]]"
- "[[OBL-BRE-04]]"
iso27001_2022:
- '8.15'
- '8.16'
iso27701_2019:
- 6.9.4
nist_csf_2:
- DE.CM-01
- DE.CM-03
- DE.AE-02
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-06 - Logging & monitoring of personal data access

Access logs for PD systems (who accessed what record) centralised in SIEM; use cases for bulk export, unusual access, privileged misuse; periodic review.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Detective |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | SOC |

## Obligations satisfied
- [[OBL-SEC-04]] Logging, monitoring & review
- [[OBL-BRE-04]] Breach awareness capability

## Test procedure
Inspect log source coverage and 3 alerts investigated.

## Evidence
- SIEM coverage
- Alert tickets

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.15, 8.16 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.9.4 |
| NIST CSF 2.0 | DE.CM-01, DE.CM-03, DE.AE-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-06]]
```
