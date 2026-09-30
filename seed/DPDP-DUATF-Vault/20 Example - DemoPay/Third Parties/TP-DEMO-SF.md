---
type: third_party
tp_id: TP-DEMO-SF
name: Salesforce
third_party_type: SaaS
processing_role:
- data_processor
country: USA
dpa_status: vendor_paper_accepted
dpa_r6_security: true
breach_notify_sla_hours: 72
tags:
- dpdp/third-party
---

# TP-DEMO-SF - Salesforce

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-SF]]
```
