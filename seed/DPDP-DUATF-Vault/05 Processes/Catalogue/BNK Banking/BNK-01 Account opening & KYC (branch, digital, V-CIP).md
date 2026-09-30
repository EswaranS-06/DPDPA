---
type: process_template
process_id: BNK-01
title: Account opening & KYC (branch, digital, V-CIP)
sector: Banking
department: Retail Banking
activities:
- Lead capture
- CKYC search/download
- Aadhaar e-KYC/OVD
- Video KYC
- Account creation in CBS
- Welcome kit
data_principals:
- Customer
- Minor & guardian
- Nominee
data_categories:
- identity
- gov_id
- biometric
- contact
- financial
- images_av
typical_systems:
- CBS
- LOS
- CKYC
- V-CIP platform
typical_third_parties:
- CKYC registry
- UIDAI (AUA/KUA)
- V-CIP vendor
- Courier
typical_lawful_basis:
- s7d
- consent
flags:
- processor
- children
- legacy_data
- decision_or_disclosure
- online_presence
context_tags:
- gov_id
- biometric
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-04]]"
- "[[OBL-NOT-01]]"
- "[[OBL-NOT-02]]"
- "[[OBL-NOT-03]]"
- "[[OBL-NOT-04]]"
- "[[OBL-NOT-05]]"
- "[[OBL-NOT-06]]"
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

# BNK-01 - Account opening & KYC (branch, digital, V-CIP)

**Sector:** Banking | **Department:** Retail Banking

> **Assessor note:** Aadhaar: use only as permitted, mask, store in Aadhaar Data Vault.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Lead capture
2. CKYC search/download
3. Aadhaar e-KYC/OVD
4. Video KYC
5. Account creation in CBS
6. Welcome kit

| Dimension | Typical values |
|---|---|
| Data principals | Customer, Minor & guardian, Nominee |
| Data categories | identity, gov_id, biometric, contact, financial, images_av |
| Systems | CBS, LOS, CKYC, V-CIP platform |
| Third parties | CKYC registry, UIDAI (AUA/KUA), V-CIP vendor, Courier |
| Lawful basis (typical) | [[s7d]], [[consent]] |
| Engine flags | processor, children, legacy_data, decision_or_disclosure, online_presence |
| Risk context | gov_id, biometric |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-NOT-01]] Notice with every consent request
- [[OBL-NOT-02]] Notice standalone & plain
- [[OBL-NOT-03]] Itemised data and specified purpose
- [[OBL-NOT-04]] Means to withdraw, exercise rights, complain
- [[OBL-NOT-05]] Language option
- [[OBL-NOT-06]] Legacy consent notice
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
