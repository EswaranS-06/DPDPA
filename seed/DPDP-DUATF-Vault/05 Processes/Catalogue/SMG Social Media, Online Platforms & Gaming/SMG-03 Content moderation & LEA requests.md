---
type: process_template
process_id: SMG-03
title: Content moderation & LEA requests
sector: Social Media, Online Platforms & Gaming
department: Trust & Safety
activities:
- Reports
- Automated moderation
- Human review
- LEA disclosure
data_principals:
- User
- Reported person
data_categories:
- communication_content
- images_av
typical_systems:
- Moderation stack
typical_third_parties:
- Moderation BPO
- LEAs
typical_lawful_basis:
- s7d
- s7e
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
sector_overlay: "[[SEC-SMG Social Media, Online Platforms & Gaming]]"
tags:
- dpdp/process-catalogue
- sector/smg
---

# SMG-03 - Content moderation & LEA requests

**Sector:** Social Media, Online Platforms & Gaming | **Department:** Trust & Safety

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Reports
2. Automated moderation
3. Human review
4. LEA disclosure

| Dimension | Typical values |
|---|---|
| Data principals | User, Reported person |
| Data categories | communication_content, images_av |
| Systems | Moderation stack |
| Third parties | Moderation BPO, LEAs |
| Lawful basis (typical) | [[s7d]], [[s7e]], [[ex17_1c]] |
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
