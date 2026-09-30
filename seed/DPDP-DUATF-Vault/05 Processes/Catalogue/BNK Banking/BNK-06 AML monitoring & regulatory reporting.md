---
type: process_template
process_id: BNK-06
title: AML monitoring & regulatory reporting
sector: Banking
department: Risk & Compliance
activities:
- Transaction monitoring
- Sanctions screening
- STR/CTR filing
- Fraud monitoring
data_principals:
- Customer
- Counterparties
data_categories:
- financial
- transaction
- identity
typical_systems:
- AML system
- FRM
typical_third_parties:
- FIU-IND
- Screening data vendors
typical_lawful_basis:
- s7d
- ex17_1c
flags:
- processor
- decision_or_disclosure
context_tags:
- ai
specific_obligations:
- "[[OBL-SCP-03]]"
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: "[[SEC-BNK Banking]]"
tags:
- dpdp/process-catalogue
- sector/bnk
---

# BNK-06 - AML monitoring & regulatory reporting

**Sector:** Banking | **Department:** Risk & Compliance

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Transaction monitoring
2. Sanctions screening
3. STR/CTR filing
4. Fraud monitoring

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Counterparties |
| Data categories | financial, transaction, identity |
| Systems | AML system, FRM |
| Third parties | FIU-IND, Screening data vendors |
| Lawful basis (typical) | [[s7d]], [[ex17_1c]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | ai |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-SCP-03]] Document and justify exemptions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
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
