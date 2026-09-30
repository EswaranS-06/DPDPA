---
type: process_template
process_id: BNK-03
title: Loan origination, underwriting & disbursal
sector: Banking
department: Lending
activities:
- Application
- Bureau pull
- Income/bank statement analysis
- Scorecard/AI decision
- Sanction & disbursal
data_principals:
- Applicant
- Co-applicant
- Guarantor
data_categories:
- identity
- gov_id
- financial
- employment
- credit_history
typical_systems:
- LOS
- BRE/scorecard
- Bureau APIs
- AA
typical_third_parties:
- Credit bureaus
- AA/FIU
- DSA
- Valuers
- Legal vendors
typical_lawful_basis:
- consent
- s7d
flags:
- processor
- decision_or_disclosure
context_tags:
- ai
- financial
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-04]]"
- "[[OBL-NOT-01]]"
- "[[OBL-NOT-02]]"
- "[[OBL-NOT-03]]"
- "[[OBL-NOT-04]]"
- "[[OBL-NOT-05]]"
- "[[OBL-CON-01]]"
- "[[OBL-CON-02]]"
- "[[OBL-CON-03]]"
- "[[OBL-CON-04]]"
- "[[OBL-CON-05]]"
- "[[OBL-CON-06]]"
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
sector_overlay: "[[SEC-BNK Banking]]"
tags:
- dpdp/process-catalogue
- sector/bnk
---

# BNK-03 - Loan origination, underwriting & disbursal

**Sector:** Banking | **Department:** Lending

> **Assessor note:** s.8(3) accuracy for credit decisions; DSA as processor.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Application
2. Bureau pull
3. Income/bank statement analysis
4. Scorecard/AI decision
5. Sanction & disbursal

| Dimension | Typical values |
|---|---|
| Data principals | Applicant, Co-applicant, Guarantor |
| Data categories | identity, gov_id, financial, employment, credit_history |
| Systems | LOS, BRE/scorecard, Bureau APIs, AA |
| Third parties | Credit bureaus, AA/FIU, DSA, Valuers, Legal vendors |
| Lawful basis (typical) | [[consent]], [[s7d]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | ai, financial |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-NOT-01]] Notice with every consent request
- [[OBL-NOT-02]] Notice standalone & plain
- [[OBL-NOT-03]] Itemised data and specified purpose
- [[OBL-NOT-04]] Means to withdraw, exercise rights, complain
- [[OBL-NOT-05]] Language option
- [[OBL-CON-01]] Valid consent standard
- [[OBL-CON-02]] No infringing consent terms
- [[OBL-CON-03]] Consent request language & contact
- [[OBL-CON-04]] Withdrawal with comparable ease
- [[OBL-CON-05]] Cease processing after withdrawal
- [[OBL-CON-06]] Proof of notice and consent
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

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
