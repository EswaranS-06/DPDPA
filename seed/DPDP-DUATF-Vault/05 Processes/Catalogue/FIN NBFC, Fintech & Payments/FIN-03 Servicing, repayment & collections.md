---
type: process_template
process_id: FIN-03
title: Servicing, repayment & collections
sector: NBFC, Fintech & Payments
department: Lending
activities:
- EMI/NACH
- Reminders
- Recovery agents
data_principals:
- Borrower
- References
data_categories:
- financial
- contact
- location
typical_systems:
- LMS
- Dialer
typical_third_parties:
- Collection agencies
- NACH sponsor bank
typical_lawful_basis:
- s7a
- ex17_1a
flags:
- processor
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
sector_overlay: "[[SEC-FIN NBFC, Fintech & Payments]]"
tags:
- dpdp/process-catalogue
- sector/fin
---

# FIN-03 - Servicing, repayment & collections

**Sector:** NBFC, Fintech & Payments | **Department:** Lending

## Typical activities (create one `processing_activity` per row that exists at the client)
1. EMI/NACH
2. Reminders
3. Recovery agents

| Dimension | Typical values |
|---|---|
| Data principals | Borrower, References |
| Data categories | financial, contact, location |
| Systems | LMS, Dialer |
| Third parties | Collection agencies, NACH sponsor bank |
| Lawful basis (typical) | [[s7a]], [[ex17_1a]] |
| Engine flags | processor |
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

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
