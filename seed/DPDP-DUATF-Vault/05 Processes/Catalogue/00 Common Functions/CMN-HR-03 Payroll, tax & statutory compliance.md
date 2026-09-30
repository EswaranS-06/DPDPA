---
type: process_template
process_id: CMN-HR-03
title: Payroll, tax & statutory compliance
sector: All sectors (common functions)
department: Human Resources
activities:
- Salary processing
- TDS & Form 16
- PF/ESI/PT/LWF filings
- Reimbursements
- Loans & advances
data_principals:
- Employee
data_categories:
- identity
- gov_id
- financial
- compensation
- tax
typical_systems:
- Payroll system
- HRMS
- Banking portal
typical_third_parties:
- Payroll outsourcer
- Bank
- Tax consultants
typical_lawful_basis:
- s7i
- s7d
flags:
- processor
- decision_or_disclosure
context_tags:
- financial
- gov_id
specific_obligations:
- "[[OBL-LB-04]]"
- "[[OBL-LB-06]]"
- "[[OBL-DQ-01]]"
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

# CMN-HR-03 - Payroll, tax & statutory compliance

**Sector:** All sectors (common functions) | **Department:** Human Resources

> **Assessor note:** Retention: Companies Act 8 yrs; tax laws; labour codes.

## Typical activities (create one `processing_activity` per row that exists at the client)
1. Salary processing
2. TDS & Form 16
3. PF/ESI/PT/LWF filings
4. Reimbursements
5. Loans & advances

| Dimension | Typical values |
|---|---|
| Data principals | Employee |
| Data categories | identity, gov_id, financial, compensation, tax |
| Systems | Payroll system, HRMS, Banking portal |
| Third parties | Payroll outsourcer, Bank, Tax consultants |
| Lawful basis (typical) | [[s7i]], [[s7d]] |
| Engine flags | processor, decision_or_disclosure |
| Risk context | financial, gov_id |

## Obligations likely triggered (beyond the always-on baseline)
Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.

- [[OBL-LB-04]] s.7(c)-(e) legal source identified
- [[OBL-LB-06]] s.7(i) employment use bounded
- [[OBL-DQ-01]] Accuracy for decisions & disclosures
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
