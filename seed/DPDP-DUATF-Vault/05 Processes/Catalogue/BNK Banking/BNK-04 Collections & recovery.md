---
type: process_template
process_id: BNK-04
title: Collections & recovery
sector: Banking
department: Lending
activities:
- Reminders
- Field visits
- Agency allocation
- Legal notices
- Skip tracing
data_principals:
- Borrower
- Guarantor
- References
data_categories:
- contact
- financial
- location
typical_systems:
- Collection system
- Dialer
typical_third_parties:
- Collection agencies
typical_lawful_basis:
- s7a
- ex17_1a
- ex17_1f
flags:
- processor
context_tags:
- location
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
sector_overlay: "[[SEC-BNK Banking]]"
tags:
- dpdp/process-catalogue
- sector/bnk
---

# BNK-04 - Collections & recovery

**Sector:** Banking | **Department:** Lending

> **Assessor note:** No harassment/contact-list misuse; references are third-party DPs.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Reminders
2. Field visits
3. Agency allocation
4. Legal notices
5. Skip tracing

| Dimension | Typical values |
|---|---|
| Data principals | Borrower, Guarantor, References |
| Data categories | contact, financial, location |
| Systems | Collection system, Dialer |
| Third parties | Collection agencies |
| Lawful basis (typical) | [[s7a]], [[ex17_1a]], [[ex17_1f]] |
| Engine flags | processor |
| Risk context | location |

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
