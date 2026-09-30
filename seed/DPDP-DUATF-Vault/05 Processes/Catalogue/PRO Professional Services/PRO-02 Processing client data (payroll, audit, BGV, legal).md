---
type: process_template
process_id: PRO-02
title: Processing client data (payroll, audit, BGV, legal)
sector: Professional Services
department: Delivery
activities:
- Data receipt
- Working papers
- Deliverables
- Return/destruction
data_principals:
- Client's employees/customers
- Candidates
data_categories:
- any
- background_check
typical_systems:
- DMS
- Data rooms
typical_third_parties:
- Network firms
- Sub-contractors
typical_lawful_basis:
- s7a
- ex17_1a
- ex17_1e
flags:
- processor
- cross_border
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-LB-03]]"
- "[[OBL-DQ-01]]"
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
sector_overlay: "[[SEC-PRO Professional Services]]"
tags:
- dpdp/process-catalogue
- sector/pro
---

# PRO-02 - Processing client data (payroll, audit, BGV, legal)

**Sector:** Professional Services | **Department:** Delivery

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Data receipt
2. Working papers
3. Deliverables
4. Return/destruction

| Dimension | Typical values |
|---|---|
| Data principals | Client's employees/customers, Candidates |
| Data categories | any, background_check |
| Systems | DMS, Data rooms |
| Third parties | Network firms, Sub-contractors |
| Lawful basis (typical) | [[s7a]], [[ex17_1a]], [[ex17_1e]] |
| Engine flags | processor, cross_border, decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
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
