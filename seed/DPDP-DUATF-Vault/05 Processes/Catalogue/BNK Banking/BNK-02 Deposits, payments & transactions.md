---
type: process_template
process_id: BNK-02
title: Deposits, payments & transactions
sector: Banking
department: Retail Banking
activities:
- Fund transfers (UPI/IMPS/NEFT/RTGS)
- Standing instructions
- Statements
- Alerts
data_principals:
- Customer
- Payee
data_categories:
- financial
- transaction
- contact
typical_systems:
- CBS
- Payment switch
- UPI
typical_third_parties:
- NPCI
- SMS gateway
typical_lawful_basis:
- s7a
- s7d
flags:
- processor
context_tags:
- financial
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
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

# BNK-02 - Deposits, payments & transactions

**Sector:** Banking | **Department:** Retail Banking

> **Assessor note:** Payee data is a third party's PD.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Fund transfers (UPI/IMPS/NEFT/RTGS)
2. Standing instructions
3. Statements
4. Alerts

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Payee |
| Data categories | financial, transaction, contact |
| Systems | CBS, Payment switch, UPI |
| Third parties | NPCI, SMS gateway |
| Lawful basis (typical) | [[s7a]], [[s7d]] |
| Engine flags | processor |
| Risk context | financial |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
