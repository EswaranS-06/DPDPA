---
type: control
control_id: CTL-SEC-13
title: Clock synchronisation
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT Ops
obligations:
- "[[LNK-CERT-03]]"
- "[[OBL-SEC-04]]"
iso27001_2022:
- '8.17'
iso27701_2019: []
nist_csf_2:
- PR.PS-04
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-13 - Clock synchronisation

All ICT systems synchronised to NIC/NPL NTP or traceable source.

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT Ops |

## Obligations satisfied
- [[LNK-CERT-03]] Clock synchronisation
- [[OBL-SEC-04]] Logging, monitoring & review

## Test procedure
Sample 10 systems' NTP config.

## Evidence
- NTP config

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.17 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | - |
| NIST CSF 2.0 | PR.PS-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-13]]
```
