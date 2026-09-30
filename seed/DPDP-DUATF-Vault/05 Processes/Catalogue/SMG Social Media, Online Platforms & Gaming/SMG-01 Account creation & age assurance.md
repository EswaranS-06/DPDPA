---
type: process_template
process_id: SMG-01
title: Account creation & age assurance
sector: Social Media, Online Platforms & Gaming
department: Platform
activities:
- Sign-up
- Age declaration/verification
- Parental consent
- Contact upload
data_principals:
- User
- Minor & parent
- Non-user contacts
data_categories:
- identity
- contact
- device_online
- biometric
typical_systems:
- Platform
typical_third_parties:
- Cloud
- Age-assurance vendor
typical_lawful_basis:
- consent
flags:
- processor
- children
- online_presence
- third_schedule
- cross_border
context_tags: []
specific_obligations:
- "[[OBL-LB-02]]"
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
- "[[OBL-CHD-01]]"
- "[[OBL-CHD-02]]"
- "[[OBL-CHD-03]]"
- "[[OBL-CHD-04]]"
- "[[OBL-CHD-05]]"
- "[[OBL-CHD-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RET-03]]"
- "[[OBL-RET-04]]"
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
sector_overlay: "[[SEC-SMG Social Media, Online Platforms & Gaming]]"
tags:
- dpdp/process-catalogue
- sector/smg
---

# SMG-01 - Account creation & age assurance

**Sector:** Social Media, Online Platforms & Gaming | **Department:** Platform

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Sign-up
2. Age declaration/verification
3. Parental consent
4. Contact upload

| Dimension | Typical values |
|---|---|
| Data principals | User, Minor & parent, Non-user contacts |
| Data categories | identity, contact, device_online, biometric |
| Systems | Platform |
| Third parties | Cloud, Age-assurance vendor |
| Lawful basis (typical) | [[consent]] |
| Engine flags | processor, children, online_presence, third_schedule, cross_border |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
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
- [[OBL-CHD-01]] Verifiable parental consent
- [[OBL-CHD-02]] Verify parent is identifiable adult
- [[OBL-CHD-03]] Age-gating / child identification
- [[OBL-CHD-04]] No detrimental processing
- [[OBL-CHD-05]] No tracking, behavioural monitoring, targeted ads
- [[OBL-CHD-06]] Fourth Schedule exemption conditions
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RET-03]] Third Schedule inactivity erasure
- [[OBL-RET-04]] 48-hour pre-erasure intimation
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
