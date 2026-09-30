---
type: process_template
process_id: CMN-ADM-01
title: CCTV surveillance
sector: All sectors (common functions)
department: Admin & Facilities
activities:
- Camera recording
- Footage review
- Footage sharing with police
- Retention & overwrite
data_principals:
- Visitor
- Employee
- Customer
data_categories:
- images_av
- location
typical_systems:
- NVR/VMS
typical_third_parties:
- Security agency
- CCTV AMC vendor
typical_lawful_basis:
- s7i
- s7a
- s7e
flags:
- processor
context_tags:
- cctv
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-ADM-01 - CCTV surveillance

**Sector:** All sectors (common functions) | **Department:** Admin & Facilities

> **Assessor note:** Signage as notice; retention (commonly 30-90 days) per policy/law; police requests log.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Camera recording
2. Footage review
3. Footage sharing with police
4. Retention & overwrite

| Dimension | Typical values |
|---|---|
| Data principals | Visitor, Employee, Customer |
| Data categories | images_av, location |
| Systems | NVR/VMS |
| Third parties | Security agency, CCTV AMC vendor |
| Lawful basis (typical) | [[s7i]], [[s7a]], [[s7e]] |
| Engine flags | processor |
| Risk context | cctv |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-06]] s.7(i) employment use bounded
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-RGT-02]] Right to access
- [[OBL-RGT-03]] Right to correction, completion, updating
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RGT-06]] Right to nominate
- [[OBL-PRC-01]] Processor only under valid contract
- [[OBL-PRC-02]] Processor oversight
- [[OBL-PRC-03]] Flow-down withdrawal & erasure
- [[OBL-PRC-04]] Processor breach notification to DF

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
