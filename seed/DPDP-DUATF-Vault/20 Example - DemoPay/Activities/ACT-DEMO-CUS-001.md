---
type: processing_activity
activity_id: ACT-DEMO-CUS-001
title: App onboarding & e-KYC
organisation: "[[ORG-DEMO Entity Profile]]"
entity_profile: "[[ORG-DEMO Entity Profile]]"
department: Customer Onboarding
process: "[[FIN-01 Digital onboarding & KYC in app]]"
owner: ''
processing_role:
- data_fiduciary
purposes:
- "[[PUR-DEMO-001]]"
lawful_basis:
- s7d
- consent
data_principals:
- Customer
data_elements:
- "[[DE-ID-001 Full name]]"
- "[[DE-GOV-003 PAN]]"
- "[[DE-GOV-001 Aadhaar number]]"
- "[[DE-BIO-002 Face template - facial recognition]]"
- "[[DE-CON-001 Mobile number]]"
digital_state: digital
systems:
- "[[SYS-DEMO-APP]]"
- "[[SYS-DEMO-LOS]]"
- "[[SYS-DEMO-CRM]]"
third_parties:
- "[[TP-DEMO-AWS]]"
- "[[TP-DEMO-KYC]]"
- "[[TP-DEMO-SF]]"
- "[[TP-DEMO-SMS]]"
data_flows:
- "[[FLW-DEMO-001]]"
- "[[FLW-DEMO-002]]"
- "[[FLW-DEMO-003]]"
- "[[FLW-DEMO-004]]"
- "[[FLW-DEMO-005]]"
flags:
- processor
- cross_border
- online_presence
- legacy_data
context_tags:
- gov_id
- biometric
- financial
overrides: {}
confidence: high
status: assessed
tags:
- dpdp/activity
---

# ACT-DEMO-CUS-001 - App onboarding & e-KYC

Catalogue template: [[FIN-01 Digital onboarding & KYC in app]]

## Engine output
![[Applicability - ACT-DEMO-CUS-001]]
