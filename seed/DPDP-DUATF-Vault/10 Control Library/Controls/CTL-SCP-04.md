---
type: control
control_id: CTL-SCP-04
title: Regulatory change monitoring
domain: "[[D02 Scoping, Applicability & Roles]]"
control_type: Detective
nature: Manual
frequency: Monthly
owner_role: Legal / Compliance
obligations:
- "[[OBL-SCP-04]]"
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
iso27001_2022:
- '5.31'
- '5.6'
iso27701_2019:
- 5.2.1
nist_csf_2:
- GV.OC-03
tags:
- dpdp/control
- dpdp/D02
---

# CTL-SCP-04 - Regulatory change monitoring

Track MeitY/Board notifications (SDF, restricted countries, s.17 notifications, FAQs), sector regulators and CERT-In; impact-assess within 30 days.

| Attribute | Value |
|---|---|
| Domain | [[D02 Scoping, Applicability & Roles]] |
| Type | Detective |
| Nature | Manual |
| Frequency | Monthly |
| Owner role | Legal / Compliance |

## Obligations satisfied
- [[OBL-SCP-04]] Monitor SDF notification
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions

## Test procedure
Inspect change log; verify last notification impact assessed.

## Evidence
- Regulatory change log

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.31, 5.6 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 5.2.1 |
| NIST CSF 2.0 | GV.OC-03 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-SCP-04]]
```
