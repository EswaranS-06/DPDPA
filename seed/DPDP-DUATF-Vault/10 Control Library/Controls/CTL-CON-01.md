---
type: control
control_id: CTL-CON-01
title: Consent capture design standard
domain: "[[D06 Consent Lifecycle]]"
control_type: Preventive
nature: Manual
frequency: Per change
owner_role: Product / UX
obligations:
- "[[OBL-CON-01]]"
- "[[OBL-CON-02]]"
- "[[LNK-CCPA-01]]"
iso27001_2022:
- '5.34'
iso27701_2019:
- 7.2.3
- 7.2.4
nist_csf_2:
- PR.DS-01
tags:
- dpdp/control
- dpdp/D06
---

# CTL-CON-01 - Consent capture design standard

Granular per-purpose consent, unticked by default, affirmative action, not conditional on unnecessary purposes, no dark patterns; UX review checklist.

| Attribute | Value |
|---|---|
| Domain | [[D06 Consent Lifecycle]] |
| Type | Preventive |
| Nature | Manual |
| Frequency | Per change |
| Owner role | Product / UX |

## Obligations satisfied
- [[OBL-CON-01]] Valid consent standard
- [[OBL-CON-02]] No infringing consent terms
- [[LNK-CCPA-01]] No dark patterns in consent/UI

## Test procedure
Walk through 3 journeys; check granularity, defaults, bundling, dark patterns.

## Evidence
- UX review
- Screen recordings

## Crosswalk
| Framework | Reference |
|---|---|
| ISO/IEC 27001:2022 Annex A | 5.34 |
| ISO/IEC 27701:2019 (remap if on 2025 edition) | 7.2.3, 7.2.4 |
| NIST CSF 2.0 | PR.DS-01 |

## Tests
```dataview
TABLE rating, test_type, tester, test_date, cycle FROM -"90 Templates" WHERE type = "control_test" AND control = [[CTL-CON-01]]
```
