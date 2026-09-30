---
type: process_template
process_id: CAP-03
title: Research, advisory & robo-advice
sector: Capital Markets
department: Advisory
activities:
- Risk profiling
- Suitability
- Recommendations
data_principals:
- Investor
data_categories:
- financial
- behavioural
typical_systems:
- Advisory engine
typical_third_parties: []
typical_lawful_basis:
- consent
- s7d
flags:
- decision_or_disclosure
context_tags:
- ai
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
- "[[OBL-RGT-01]]"
- "[[OBL-RGT-02]]"
- "[[OBL-RGT-03]]"
- "[[OBL-RGT-04]]"
- "[[OBL-RGT-06]]"
sector_overlay: "[[SEC-CAP Capital Markets]]"
tags:
- dpdp/process-catalogue
- sector/cap
---

# CAP-03 - Research, advisory & robo-advice

**Sector:** Capital Markets | **Department:** Advisory

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Risk profiling
2. Suitability
3. Recommendations

| Dimension | Typical values |
|---|---|
| Data principals | Investor |
| Data categories | financial, behavioural |
| Systems | Advisory engine |
| Third parties | - |
| Lawful basis (typical) | [[consent]], [[s7d]] |
| Engine flags | decision_or_disclosure |
| Risk context | ai |

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
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-RGT-02]] Right to access
- [[OBL-RGT-03]] Right to correction, completion, updating
- [[OBL-RGT-04]] Right to erasure
- [[OBL-RGT-06]] Right to nominate

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
