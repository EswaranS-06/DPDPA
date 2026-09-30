---
type: process_template
process_id: CMN-ADM-03
title: Physical access control
sector: All sectors (common functions)
department: Admin & Facilities
activities:
- Access cards
- Biometric/face readers
- Access logs
data_principals:
- Employee
- Contractor
data_categories:
- identity
- biometric
- location
typical_systems:
- PACS
typical_third_parties:
- PACS vendor
typical_lawful_basis:
- s7i
flags:
- processor
context_tags:
- biometric
specific_obligations:
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-ADM-03 - Physical access control

**Sector:** All sectors (common functions) | **Department:** Admin & Facilities

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Access cards
2. Biometric/face readers
3. Access logs

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Contractor |
| Data categories | identity, biometric, location |
| Systems | PACS |
| Third parties | PACS vendor |
| Lawful basis (typical) | [[s7i]] |
| Engine flags | processor |
| Risk context | biometric |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-06]] s.7(i) employment use bounded
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RGT-01]] Publish means & identifiers for rights
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
