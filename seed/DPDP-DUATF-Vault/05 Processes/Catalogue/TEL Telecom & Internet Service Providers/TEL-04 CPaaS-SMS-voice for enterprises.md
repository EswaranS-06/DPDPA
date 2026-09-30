---
type: process_template
process_id: TEL-04
title: CPaaS/SMS/voice for enterprises
sector: Telecom & Internet Service Providers
department: Enterprise
activities:
- Message routing
- DLT scrubbing
- Delivery reports
data_principals:
- End recipients
data_categories:
- contact
- communication_content
typical_systems:
- SMSC
- DLT
typical_third_parties:
- Aggregators
typical_lawful_basis:
- s7a
flags:
- processor
context_tags: []
specific_obligations:
- "[[OBL-LB-03]]"
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
sector_overlay: "[[SEC-TEL Telecom & Internet Service Providers]]"
tags:
- dpdp/process-catalogue
- sector/tel
---

# TEL-04 - CPaaS/SMS/voice for enterprises

**Sector:** Telecom & Internet Service Providers | **Department:** Enterprise

> **Assessor note:** Usually processor for enterprise customers.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Message routing
2. DLT scrubbing
3. Delivery reports

| Dimension | Typical values |
|---|---|
| Data principals | End recipients |
| Data categories | contact, communication_content |
| Systems | SMSC, DLT |
| Third parties | Aggregators |
| Lawful basis (typical) | [[s7a]] |
| Engine flags | processor |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
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
