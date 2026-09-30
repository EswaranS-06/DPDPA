---
type: process_template
process_id: CMN-IT-01
title: User accounts, IAM & directory
sector: All sectors (common functions)
department: IT
activities:
- Account provisioning
- SSO/MFA
- Access reviews
- Deprovisioning
data_principals:
- Employee
- Contractor
- Customer users
data_categories:
- identity
- credential
- device_online
typical_systems:
- AD/Entra ID
- IAM
typical_third_parties:
- IAM SaaS
typical_lawful_basis:
- s7i
- s7a
flags:
- processor
- cross_border
context_tags: []
specific_obligations:
- "[[OBL-LB-03]]"
- "[[OBL-LB-06]]"
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

# CMN-IT-01 - User accounts, IAM & directory

**Sector:** All sectors (common functions) | **Department:** IT

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Account provisioning
2. SSO/MFA
3. Access reviews
4. Deprovisioning

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Contractor, Customer users |
| Data categories | identity, credential, device_online |
| Systems | AD/Entra ID, IAM |
| Third parties | IAM SaaS |
| Lawful basis (typical) | [[s7i]], [[s7a]] |
| Engine flags | processor, cross_border |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-03]] s.7(a) voluntary provision conditions
- [[OBL-LB-06]] s.7(i) employment use bounded
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
