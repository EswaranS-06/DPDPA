---
type: control
control_id: CTL-SEC-02
title: Encryption at rest & in transit
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT Security
obligations:
- "[[OBL-SEC-02]]"
iso27001_2022:
- '8.24'
iso27701_2019:
- 6.7.1.1
- 7.4.9
nist_csf_2:
- PR.DS-01
- PR.DS-02
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-02 - Encryption at rest & in transit

Personal data encrypted at rest (DB/storage/backups/endpoints) and in transit (TLS 1.2+); key management with rotation.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT Security |

## Obligations satisfied
- [[OBL-SEC-02]] Encryption / masking / tokenisation

## Test procedure
Inspect configs for in-scope DBs, storage, laptops; TLS scan.

## Evidence
- Config screenshots
- KMS policy
- TLS scan

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.24 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 6.7.1.1, 7.4.9 |
| NIST CSF 2.0 | PR.DS-01, PR.DS-02 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-02]]
```
