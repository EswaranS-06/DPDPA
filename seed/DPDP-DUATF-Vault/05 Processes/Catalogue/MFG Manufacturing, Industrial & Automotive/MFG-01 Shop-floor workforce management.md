---
type: process_template
process_id: MFG-01
title: Shop-floor workforce management
sector: Manufacturing, Industrial & Automotive
department: Plant HR
activities:
- Contract labour onboarding
- Biometric attendance
- Canteen
- Safety induction
data_principals:
- Contract worker
- Employee
data_categories:
- identity
- gov_id
- biometric
- financial
typical_systems:
- HRMS
- Biometric
- Gate system
typical_third_parties:
- Manpower contractors
typical_lawful_basis:
- s7i
- s7d
flags:
- processor
context_tags:
- biometric
- gov_id
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: "[[SEC-MFG Manufacturing, Industrial & Automotive]]"
tags:
- dpdp/process-catalogue
- sector/mfg
---

# MFG-01 - Shop-floor workforce management

**Sector:** Manufacturing, Industrial & Automotive | **Department:** Plant HR

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Contract labour onboarding
2. Biometric attendance
3. Canteen
4. Safety induction

| Dimension | Typical values |
|---|---|
| Data principals | Contract worker, Employee |
| Data categories | identity, gov_id, biometric, financial |
| Systems | HRMS, Biometric, Gate system |
| Third parties | Manpower contractors |
| Lawful basis (typical) | [[s7i]], [[s7d]] |
| Engine flags | processor |
| Risk context | biometric, gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-06]] s.7(i) employment use bounded
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
