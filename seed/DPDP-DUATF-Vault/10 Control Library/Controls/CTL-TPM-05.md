---
type: control
control_id: CTL-TPM-05
title: Data sharing with other Data Fiduciaries
domain: "[[D13 Processor & Third-Party Management]]"
control_type: Preventive
nature: Manual
frequency: Per arrangement
owner_role: Legal / Privacy
obligations:
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-LB-01]]"
iso27001_2022:
- '5.14'
iso27701_2019:
- 7.5.4
nist_csf_2:
- GV.SC-05
tags:
- dpdp/control
- dpdp/D13
---

# CTL-TPM-05 - Data sharing with other Data Fiduciaries

Sharing with independent DFs (insurers, banks, group cos, partners) has basis, notice disclosure, sharing agreement and accuracy check.

| Attribute | Value |
|---|---|
| Domain | [[D13 Processor & Third-Party Management]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per arrangement |
| Owner role | Legal / Privacy |

## Obligations satisfied
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-02]] Right to access
- [[OBL-LB-01]] Specified purpose defined per activity

## Test procedure
Sample 3 sharing arrangements.

## Evidence
- Agreements
- Notices

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.5.4 |
| NIST CSF 2.0 | GV.SC-05 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-TPM-05]]
```
