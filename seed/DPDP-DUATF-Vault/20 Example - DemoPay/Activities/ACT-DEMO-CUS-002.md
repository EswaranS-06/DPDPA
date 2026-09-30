---
type: processing_activity
activity_id: ACT-DEMO-CUS-002
title: Underwriting & credit decision
organisation: "[[ORG-DEMO Entity Profile]]"
entity_profile: "[[ORG-DEMO Entity Profile]]"
department: Credit
process: "[[FIN-02 Underwriting with alternate data]]"
owner: ''
processing_role:
- data_fiduciary
purposes:
- "[[PUR-DEMO-002]]"
lawful_basis:
- consent
data_principals:
- Applicant
data_elements:
- "[[DE-FIN-005 Credit score - bureau report]]"
- "[[DE-FIN-006 Transaction history]]"
- "[[DE-FIN-004 Income - salary - CTC]]"
digital_state: digital
systems:
- "[[SYS-DEMO-LOS]]"
third_parties:
- "[[TP-DEMO-BUREAU]]"
- "[[TP-DEMO-AWS]]"
data_flows:
- "[[FLW-DEMO-006]]"
- "[[FLW-DEMO-007]]"
flags:
- processor
- decision_or_disclosure
context_tags:
- financial
- ai
overrides: {}
confidence: medium
status: assessed
tags:
- dpdp/activity
---

# ACT-DEMO-CUS-002 - Underwriting & credit decision

Catalogue template: [[FIN-02 Underwriting with alternate data]]

## Engine output
![[Applicability - ACT-DEMO-CUS-002]]
