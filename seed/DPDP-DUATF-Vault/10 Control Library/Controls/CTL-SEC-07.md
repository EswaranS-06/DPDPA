---
type: control
control_id: CTL-SEC-07
title: Log & data retention for investigation (1 yr / 180 d India)
domain: "[[D09 Security Safeguards]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT / SOC
obligations:
- "[[OBL-SEC-06]]"
- "[[OBL-RET-05]]"
- "[[LNK-CERT-02]]"
iso27001_2022:
- '8.15'
iso27701_2019:
- 7.4.7
nist_csf_2:
- PR.PS-04
tags:
- dpdp/control
- dpdp/D09
---

# CTL-SEC-07 - Log & data retention for investigation (1 yr / 180 d India)

Logs and relevant PD retained >= 1 year (Rule 6(1)(e), Rule 8(3)); ICT logs rolling 180 days in India (CERT-In).

| Attribute | Value |
|---|---|
| Domain | [[D09 Security Safeguards]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT / SOC |

## Obligations satisfied
- [[OBL-SEC-06]] Retain logs & data 1 year for investigation
- [[OBL-RET-05]] 1-year floor for data, traffic data & logs
- [[LNK-CERT-02]] ICT logs 180 days within India

## Test procedure
Inspect retention settings and storage region.

## Evidence
- Retention config

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 8.15 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.4.7 |
| NIST CSF 2.0 | PR.PS-04 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SEC-07]]
```
