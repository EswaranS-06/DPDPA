---
type: process_template
process_id: GOV-01
title: Beneficiary registration & DBT
sector: Government, PSUs & Public Bodies
department: Schemes
activities:
- Application
- Eligibility verification
- Aadhaar seeding
- DBT payment
- Grievance
data_principals:
- Beneficiary
- Family members
data_categories:
- identity
- gov_id
- financial
- family
- demographic
typical_systems:
- Scheme portal
- PFMS
- Aadhaar
typical_third_parties:
- CSCs
- Banks
- NIC
typical_lawful_basis:
- s7b
flags:
- processor
- decision_or_disclosure
context_tags:
- gov_id
specific_obligations:
- "[[OBL-DQ-01]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
- "[[OBL-STA-01]]"
sector_overlay: "[[SEC-GOV Government, PSUs & Public Bodies]]"
tags:
- dpdp/process-catalogue
- sector/gov
---

# GOV-01 - Beneficiary registration & DBT

**Sector:** Government, PSUs & Public Bodies | **Department:** Schemes

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Application
2. Eligibility verification
3. Aadhaar seeding
4. DBT payment
5. Grievance

| Dimension | Typical values |
|---|---|
| Data principals | Beneficiary, Family members |
| Data categories | identity, gov_id, financial, family, demographic |
| Systems | Scheme portal, PFMS, Aadhaar |
| Third parties | CSCs, Banks, NIC |
| Lawful basis (typical) | [[s7b]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-DQ-01]] Accuracy for decisions & disclosures
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RGT-01]] Publish means & identifiers for rights
- [[OBL-PRC-01]] Processor only under valid contract
- [[OBL-PRC-02]] Processor oversight
- [[OBL-PRC-03]] Flow-down withdrawal & erasure
- [[OBL-PRC-04]] Processor breach notification to DF
- [[OBL-STA-01]] State benefit processing per Second Schedule

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
