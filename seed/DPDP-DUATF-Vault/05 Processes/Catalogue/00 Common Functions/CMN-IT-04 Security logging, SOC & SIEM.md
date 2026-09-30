---
type: process_template
process_id: CMN-IT-04
title: Security logging, SOC & SIEM
sector: All sectors (common functions)
department: IT
activities:
- Log collection
- Threat monitoring
- Incident investigation
data_principals:
- Employee
- Customer
- Any
data_categories:
- device_online
- identity
- behavioural
typical_systems:
- SIEM
- EDR
- Firewall
typical_third_parties:
- MSSP
typical_lawful_basis:
- s7i
- s7d
flags:
- processor
- cross_border
context_tags: []
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
- "[[OBL-XB-01]]"
- "[[OBL-XB-02]]"
- "[[OBL-XB-03]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-IT-04 - Security logging, SOC & SIEM

**Sector:** All sectors (common functions) | **Department:** IT

> **Assessor note:** CERT-In 180-day India logs; MSSP location.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Log collection
2. Threat monitoring
3. Incident investigation

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Customer, Any |
| Data categories | device_online, identity, behavioural |
| Systems | SIEM, EDR, Firewall |
| Third parties | MSSP |
| Lawful basis (typical) | [[s7i]], [[s7d]] |
| Engine flags | processor, cross_border |
| Risk context | - |

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
- [[OBL-XB-01]] No transfer to restricted countries
- [[OBL-XB-02]] Foreign-State access conditions
- [[OBL-XB-03]] Sectoral localisation prevails

## Discovery prompts
- Which of the activities above exist here, and are there others?
- Confirm the data fields against real forms and screens.
- Confirm every system (incl. Excel/WhatsApp) and every recipient.
- Check whether the lawful basis per purpose is really as typical.
- Check whether the flags hold, especially children, cross-border and processors.
