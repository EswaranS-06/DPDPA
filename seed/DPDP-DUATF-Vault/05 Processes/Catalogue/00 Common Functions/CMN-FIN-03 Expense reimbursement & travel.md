---
type: process_template
process_id: CMN-FIN-03
title: Expense reimbursement & travel
sector: All sectors (common functions)
department: Finance
activities:
- Expense claims with bills
- Travel booking
- Corporate cards
data_principals:
- Employee
- Travellers
data_categories:
- identity
- financial
- travel
- location
typical_systems:
- Expense tool
- Travel portal
typical_third_parties:
- Travel agency
- Card issuer
typical_lawful_basis:
- s7i
flags:
- processor
- cross_border
context_tags: []
specific_obligations:
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-FIN-03 - Expense reimbursement & travel

**Sector:** All sectors (common functions) | **Department:** Finance

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Expense claims with bills
2. Travel booking
3. Corporate cards

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Travellers |
| Data categories | identity, financial, travel, location |
| Systems | Expense tool, Travel portal |
| Third parties | Travel agency, Card issuer |
| Lawful basis (typical) | [[s7i]] |
| Engine flags | processor, cross_border |
| Risk context | - |

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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
