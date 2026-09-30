---
type: control
control_id: CTL-TPM-03
title: DPDP data processing agreement (DPA)
domain: "[[D13 Processor & Third-Party Management]]"
control_type: Preventive
nature: Manual
frequency: Per contract
owner_role: Legal
obligations:
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
iso27001_2022:
- '5.20'
iso27701_2019:
- 7.2.6
- 8.2.1
nist_csf_2:
- GV.SC-05
tags:
- dpdp/control
- dpdp/D13
---

# CTL-TPM-03 - DPDP data processing agreement (DPA)

Standard DPA: process only on instruction, security (R6), breach notice SLA (e.g. 24h or less), cessation on withdrawal, erasure/return, sub-processor approval, audit rights, cross-border restrictions, cooperation on rights.

| Attribute | Value |
|---|---|
| Domain | [[D13 Processor & Third-Party Management]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per contract |
| Owner role | Legal |

## Obligations satisfied
- [[OBL-PRC-01]] Processor only under valid contract
- [[OBL-PRC-03]] Flow-down withdrawal & erasure
- [[OBL-PRC-04]] Processor breach notification to DF
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too

## Test procedure
Sample 10 contracts vs DPA checklist.

## Evidence
- Executed DPAs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.20 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.6, 8.2.1 |
| NIST CSF 2.0 | GV.SC-05 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-TPM-03]]
```
