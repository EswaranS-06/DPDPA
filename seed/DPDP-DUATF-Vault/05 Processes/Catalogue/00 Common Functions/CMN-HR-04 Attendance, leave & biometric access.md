---
type: process_template
process_id: CMN-HR-04
title: Attendance, leave & biometric access
sector: All sectors (common functions)
department: Human Resources
activities:
- Biometric/face attendance
- Leave & shift management
- Geo-attendance for field staff
data_principals:
- Employee
- Contract worker
data_categories:
- identity
- biometric
- location
- attendance
typical_systems:
- Biometric devices
- HRMS
- Mobile app
typical_third_parties:
- Attendance device vendor
typical_lawful_basis:
- s7i
flags:
- processor
context_tags:
- biometric
- location
specific_obligations:
- "[[OBL-LB-06]]"
- "[[OBL-SEC-07]]"
- "[[OBL-RET-02]]"
- "[[OBL-RGT-01]]"
- "[[OBL-PRC-01]]"
- "[[OBL-PRC-02]]"
- "[[OBL-PRC-03]]"
- "[[OBL-PRC-04]]"
sector_overlay: ''
tags:
- dpdp/process-catalogue
- sector/cmn
---

# CMN-HR-04 - Attendance, leave & biometric access

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** Biometric = high-risk context; consider alternatives & strong security.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Biometric/face attendance
2. Leave & shift management
3. Geo-attendance for field staff

| Dimension | Typical values |
|---|---|
| Data principals | Employee, Contract worker |
| Data categories | identity, biometric, location, attendance |
| Systems | Biometric devices, HRMS, Mobile app |
| Third parties | Attendance device vendor |
| Lawful basis (typical) | [[s7i]] |
| Engine flags | processor |
| Risk context | biometric, location |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

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
