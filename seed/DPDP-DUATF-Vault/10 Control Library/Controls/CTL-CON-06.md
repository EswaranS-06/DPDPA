---
type: control
control_id: CTL-CON-06
title: Marketing consent & DLT compliance
domain: "[[D06 Consent Lifecycle]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: Marketing
obligations:
- "[[LNK-TRAI-01]]"
- "[[OBL-CON-01]]"
- "[[OBL-CON-05]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.3.4
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-06 - Marketing consent & DLT compliance

Marketing uses separate consent; SMS/voice via DLT registered headers/templates; DND scrubbing; unsubscribe honoured.

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | Marketing |

## Obligations satisfied
- [[LNK-TRAI-01]] Commercial communication preferences
- [[OBL-CON-01]] Valid consent standard
- [[OBL-CON-05]] Cease processing after withdrawal

## Test procedure
Sample 3 campaigns; verify consent filter and DLT.

## Evidence
- Campaign audience rules
- DLT records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.4 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-06]]
```
