---
type: control
control_id: CTL-CON-05
title: Consent Manager integration
domain: "[[D06 Consent Lifecycle]]"
control_type: Preventive
nature: Automated
frequency: Continuous
owner_role: IT / Privacy
obligations:
- "[[OBL-CON-07]]"
iso27001_2022:
- '5.14'
iso27701_2019:
- 7.3.4
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-05 - Consent Manager integration

Integration with registered Consent Managers (APIs, event handling, reconciliation) once regime is live (Phase 2).

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Preventive |
| Nature | Automated |
| Frequency | Continuous |
| Owner role | IT / Privacy |

## Obligations satisfied
- [[OBL-CON-07]] Accept Consent Manager instructions

## Test procedure
Review integration spec and test events.

## Evidence
- Integration spec
- Logs

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.14 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.3.4 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-05]]
```
