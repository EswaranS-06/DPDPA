---
type: process_template
process_id: PHA-02
title: Pharmacovigilance & adverse events
sector: Pharma, Medical Devices & Clinical Research
department: Safety
activities:
- AE intake (call centre, social, HCP)
- Case processing
- Regulatory submission
data_principals:
- Patient
- Reporter
data_categories:
- health
- identity
- contact
typical_systems:
- Safety database
typical_third_parties:
- PV vendor
- Global safety
typical_lawful_basis:
- s7d
- s7g
flags:
- processor
- cross_border
context_tags:
- health
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-05]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: "[[SEC-PHA Pharma, Medical Devices & Clinical Research]]"
tags:
- dpdp/process-catalogue
- sector/pha
---

# PHA-02 - Pharmacovigilance & adverse events

**Sector:** Pharma, Medical Devices & Clinical Research | **Department:** Safety

## Typical activities (create one `processing_activity` per row that exists at the client)
1. AE intake (call centre, social, HCP)
2. Case processing
3. Regulatory submission

| Dimension | Typical values |
|---|---|
| Data principals | Patient, Reporter |
| Data categories | health, identity, contact |
| Systems | Safety database |
| Third parties | PV vendor, Global safety |
| Lawful basis (typical) | [[s7d]], [[s7g]] |
| Engine flags | processor, cross_border |
| Risk context | health |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-05]] s.7(f)-(h) emergency use bounded
- [[OBL-SEC-07]] Security clauses in processor contracts
- [[OBL-RET-02]] Processors erase too
- [[OBL-RGT-01]] Publish means & identifiers for rights
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
