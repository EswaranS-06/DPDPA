---
type: process_template
process_id: CAP-02
title: Order management & call recording
sector: Capital Markets
department: Trading
activities:
- Order placement
- Call-and-trade recording
- Contract notes
data_principals:
- Investor
data_categories:
- financial
- voice
- transaction
typical_systems:
- OMS
- Voice logger
typical_third_parties:
- Exchanges
typical_lawful_basis:
- s7d
- s7a
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-04]]"
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

# CAP-02 - Order management & call recording

**Sector:** Capital Markets | **Department:** Trading

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Order placement
2. Call-and-trade recording
3. Contract notes

| Dimension | Typical values |
|---|---|
| Data principals | Investor |
| Data categories | financial, voice, transaction |
| Systems | OMS, Voice logger |
| Third parties | Exchanges |
| Lawful basis (typical) | [[s7d]], [[s7a]] |
| Engine flags | decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
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
