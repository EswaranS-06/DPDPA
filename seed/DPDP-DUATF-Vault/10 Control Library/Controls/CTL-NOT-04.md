---
type: control
control_id: CTL-NOT-04
title: Notice versioning
domain: "[[D05 Notice]]"
control_type: Directive
nature: IT-dependent manual
frequency: Per change
owner_role: Privacy / IT
obligations:
- "[[OBL-CON-06]]"
- "[[OBL-NOT-01]]"
iso27001_2022:
- '5.33'
iso27701_2019:
- 7.2.8
- 7.3.3
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D05
---

# CTL-NOT-04 - Notice versioning

Notices versioned with effective dates; version ID stored with each consent record.

| Attribute | Value |
|---|---|
| Domain | [[D05 Notice]] |
| Type | Directive |
| Nature | IT-dependent manual |
| Frequency | Per change |
| Owner role | Privacy / IT |

## Obligations satisfied
- [[OBL-CON-06]] Proof of notice and consent
- [[OBL-NOT-01]] Notice with every consent request

## Test procedure
Pick 5 consent records; trace to notice version text.

## Evidence
- Version repository
- Consent records

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.33 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.8, 7.3.3 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-NOT-04]]
```
