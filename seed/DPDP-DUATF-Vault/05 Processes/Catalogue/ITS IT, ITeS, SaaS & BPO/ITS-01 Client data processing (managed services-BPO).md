---
type: process_template
process_id: ITS-01
title: Client data processing (managed services/BPO)
sector: IT, ITeS, SaaS & BPO
department: Delivery
activities:
- Access to client systems
- Transaction processing
- Customer support on behalf of client
data_principals:
- Client's customers/employees
data_categories:
- any
typical_systems:
- Client systems
- VDI
typical_third_parties:
- Sub-processors
typical_lawful_basis:
- ex17_1d
- s7a
flags:
- processor
- cross_border
context_tags: []
specific_obligations:
- "[[OBL-SCP-03]]"
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: "[[SEC-ITS IT, ITeS, SaaS & BPO]]"
tags:
- dpdp/process-catalogue
- sector/its
---

# ITS-01 - Client data processing (managed services/BPO)

**Sector:** IT, ITeS, SaaS & BPO | **Department:** Delivery

> **Assessor note:** Record whether principals are in India or abroad.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Access to client systems
2. Transaction processing
3. Customer support on behalf of client

| Dimension | Typical values |
|---|---|
| Data principals | Client's customers/employees |
| Data categories | any |
| Systems | Client systems, VDI |
| Third parties | Sub-processors |
| Lawful basis (typical) | [[ex17_1d]], [[s7a]] |
| Engine flags | processor, cross_border |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
