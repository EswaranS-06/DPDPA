---
type: process_template
process_id: CMN-HR-01
title: Recruitment & applicant tracking
sector: All sectors (common functions)
department: Human Resources
activities:
- Job posting & application intake
- CV screening (manual/AI)
- Interview scheduling & notes
- Assessments / psychometric tests
- Offer & rejection communication
- Talent pool retention
data_principals:
- Job applicant
- Referrer
data_categories:
- identity
- contact
- education
- employment_history
- compensation_expectation
- assessment_results
typical_systems:
- ATS
- Job portals
- Email
- Video interview tool
typical_third_parties:
- Job portals
- Recruitment agencies
- Assessment vendors
typical_lawful_basis:
- consent
- s7a
flags:
- processor
- online_presence
- decision_or_disclosure
- cross_border
context_tags:
- ai
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-03]]"
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-HR-01 - Recruitment & applicant tracking

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** Talent-pool retention beyond the role needs consent; AI screening = decision affecting DP (s.8(3)).

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Job posting & application intake
2. CV screening (manual/AI)
3. Interview scheduling & notes
4. Assessments / psychometric tests
5. Offer & rejection communication
6. Talent pool retention

| Dimension | Typical values |
|---|---|
| Data principals | Job applicant, Referrer |
| Data categories | identity, contact, education, employment_history, compensation_expectation, assessment_results |
| Systems | ATS, Job portals, Email, Video interview tool |
| Third parties | Job portals, Recruitment agencies, Assessment vendors |
| Lawful basis (typical) | [[consent]], [[s7a]] |
| Engine flags | processor, online_presence, decision_or_disclosure, cross_border |
| Risk context | ai |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-03]] s.7(a) voluntary provision conditions
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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
