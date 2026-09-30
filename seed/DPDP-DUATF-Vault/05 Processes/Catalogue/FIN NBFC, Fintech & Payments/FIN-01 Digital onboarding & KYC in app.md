---
type: process_template
process_id: FIN-01
title: Digital onboarding & KYC in app
sector: NBFC, Fintech & Payments
department: Onboarding
activities:
- App install & permissions
- OTP
- e-KYC / CKYC
- Selfie liveness
- Bank account verification (penny drop)
data_principals:
- Customer
data_categories:
- identity
- gov_id
- biometric
- device_online
- financial
- contact
typical_systems:
- Mobile app
- KYC stack
typical_third_parties:
- KYC vendors
- UIDAI
- Liveness vendor
- Cloud
typical_lawful_basis:
- consent
- s7d
flags:
- processor
- online_presence
- cross_border
context_tags:
- biometric
- gov_id
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: "[[SEC-FIN NBFC, Fintech & Payments]]"
tags:
- dpdp/process-catalogue
- sector/fin
---

# FIN-01 - Digital onboarding & KYC in app

**Sector:** NBFC, Fintech & Payments | **Department:** Onboarding

## Typical activities (create one `processing_activity` per row that exists at the client)
1. App install & permissions
2. OTP
3. e-KYC / CKYC
4. Selfie liveness
5. Bank account verification (penny drop)

| Dimension | Typical values |
|---|---|
| Data principals | Customer |
| Data categories | identity, gov_id, biometric, device_online, financial, contact |
| Systems | Mobile app, KYC stack |
| Third parties | KYC vendors, UIDAI, Liveness vendor, Cloud |
| Lawful basis (typical) | [[consent]], [[s7d]] |
| Engine flags | processor, online_presence, cross_border |
| Risk context | biometric, gov_id |

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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
