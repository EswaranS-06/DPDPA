---
type: process_template
process_id: GOV-02
title: Certificates, licences & permits
sector: Government, PSUs & Public Bodies
department: Services
activities:
- Application
- Verification
- Issuance
- DigiLocker push
data_principals:
- Applicant
data_categories:
- identity
- gov_id
- property
typical_systems:
- e-District
- DigiLocker
typical_third_parties:
- NIC
typical_lawful_basis:
- s7b
- s7c
flags:
- decision_or_disclosure
context_tags: []
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-DQ-01]]"
- "[[OBL-RGT-01]]"
- "[[OBL-STA-01]]"
sector_overlay: "[[SEC-GOV Government, PSUs & Public Bodies]]"
tags:
- dpdp/process-catalogue
- sector/gov
---

# GOV-02 - Certificates, licences & permits

**Sector:** Government, PSUs & Public Bodies | **Department:** Services

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Application
2. Verification
3. Issuance
4. DigiLocker push

| Dimension | Typical values |
|---|---|
| Data principals | Applicant |
| Data categories | identity, gov_id, property |
| Systems | e-District, DigiLocker |
| Third parties | NIC |
| Lawful basis (typical) | [[s7b]], [[s7c]] |
| Engine flags | decision_or_disclosure |
| Risk context | - |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-STA-01]] State benefit processing per Second Schedule

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
