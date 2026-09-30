---
type: process_template
process_id: CMN-HR-05
title: Employee benefits & insurance
sector: All sectors (common functions)
department: Human Resources
activities:
- Group health/term insurance enrolment
- Dependant details
- Claims support
- Wellness programmes
data_principals:
- Employee
- Dependants incl. children
data_categories:
- identity
- family
- health
- financial
typical_systems:
- HRMS
- Insurer/TPA portal
typical_third_parties:
- Insurer
- TPA
- Broker
- Wellness vendor
typical_lawful_basis:
- s7i
- consent
flags:
- processor
- children
- decision_or_disclosure
context_tags:
- health
specific_obligations:
- "[[OBL-LB-02]]"
- "[[OBL-LB-06]]"
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
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-HR-05 - Employee benefits & insurance

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** Wellness apps and health-risk assessments are NOT core employment -> consent.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Group health/term insurance enrolment
2. Dependant details
3. Claims support
4. Wellness programmes

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Dependants incl. children |
| Data categories | identity, family, health, financial |
| Systems | HRMS, Insurer/TPA portal |
| Third parties | Insurer, TPA, Broker, Wellness vendor |
| Lawful basis (typical) | [[s7i]], [[consent]] |
| Engine flags | processor, children, decision_or_disclosure |
| Risk context | health |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-02]] Data minimisation for consent
- [[OBL-LB-06]] s.7(i) employment use bounded
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
