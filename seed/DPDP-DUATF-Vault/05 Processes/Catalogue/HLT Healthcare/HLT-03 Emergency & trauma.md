---
type: process_template
process_id: HLT-03
title: Emergency & trauma
sector: Healthcare
department: Clinical
activities:
- Unidentified patient registration
- MLC intimation to police
- Emergency treatment
data_principals:
- Patient
data_categories:
- health
- identity
- images_av
typical_systems:
- HIS
typical_third_parties:
- Police (LEA)
typical_lawful_basis:
- s7f
- s7d
flags:
- decision_or_disclosure
context_tags:
- health
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-05]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
sector_overlay: "[[SEC-HLT Healthcare]]"
tags:
- dpdp/process-catalogue
- sector/hlt
---

# HLT-03 - Emergency & trauma

**Sector:** Healthcare | **Department:** Clinical

> **Assessor note:** s.7(f) emergency; MLC disclosure s.7(d).

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Unidentified patient registration
2. MLC intimation to police
3. Emergency treatment

| Dimension | Typical values |
|---|---|
| Data principals | Patient |
| Data categories | health, identity, images_av |
| Systems | HIS |
| Third parties | Police (LEA) |
| Lawful basis (typical) | [[s7f]], [[s7d]] |
| Engine flags | decision_or_disclosure |
| Risk context | health |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-05]] s.7(f)-(h) emergency use bounded
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
