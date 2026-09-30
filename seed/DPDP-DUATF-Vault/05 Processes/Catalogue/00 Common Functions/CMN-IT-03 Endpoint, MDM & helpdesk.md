---
type: process_template
process_id: CMN-IT-03
title: Endpoint, MDM & helpdesk
sector: All sectors (common functions)
department: IT
activities:
- Device management
- Remote support sessions
- Asset tagging
data_principals:
- Employee
data_categories:
- device_online
- location
- identity
typical_systems:
- MDM
- EDR
- ITSM
typical_third_parties:
- MSP
typical_lawful_basis:
- s7i
flags:
- processor
context_tags:
- location
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

# CMN-IT-03 - Endpoint, MDM & helpdesk

**Sector:** All sectors (common functions) | **Department:** IT

> **Assessor note:** Remote support may expose customer data on screens.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Device management
2. Remote support sessions
3. Asset tagging

| Dimension | Typical values |
|---|---|
| Data principals | Employee |
| Data categories | device_online, location, identity |
| Systems | MDM, EDR, ITSM |
| Third parties | MSP |
| Lawful basis (typical) | [[s7i]] |
| Engine flags | processor |
| Risk context | location |

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
