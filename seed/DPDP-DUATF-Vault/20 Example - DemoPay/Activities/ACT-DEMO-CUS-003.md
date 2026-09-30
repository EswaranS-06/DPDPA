---
type: processing_activity
activity_id: ACT-DEMO-CUS-003
title: Collections (tele & field)
organisation: "[[ORG-DEMO Entity Profile]]"
entity_profile: "[[ORG-DEMO Entity Profile]]"
department: Collections
process: "[[FIN-03 Servicing, repayment & collections]]"
owner: ''
processing_role:
- data_fiduciary
purposes:
- "[[PUR-DEMO-003]]"
lawful_basis:
- s7a
data_principals:
- Borrower
- References
data_elements:
- "[[DE-CON-001 Mobile number]]"
- "[[DE-CON-003 Postal address]]"
- "[[DE-FIN-007 Loan - EMI details]]"
digital_state: digital
systems:
- "[[SYS-DEMO-CRM]]"
- "[[SYS-DEMO-XLS]]"
third_parties:
- "[[TP-DEMO-COLL]]"
- "[[TP-DEMO-SMS]]"
- "[[TP-DEMO-SF]]"
data_flows:
- "[[FLW-DEMO-008]]"
- "[[FLW-DEMO-009]]"
- "[[FLW-DEMO-010]]"
flags:
- processor
- cross_border
context_tags:
- financial
- location
overrides: {}
confidence: low
status: assessed
tags:
- dpdp/activity
---

# ACT-DEMO-CUS-003 - Collections (tele & field)

Catalogue template: [[FIN-03 Servicing, repayment & collections]]

## Engine output
![[Applicability - ACT-DEMO-CUS-003]]
