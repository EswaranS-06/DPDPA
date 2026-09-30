---
type: third_party
tp_id: TP-DEMO-AWS
name: AWS (Mumbai region)
third_party_type: Cloud/IaaS
processing_role:
- data_processor
country: India
dpa_status: signed
dpa_r6_security: true
breach_notify_sla_hours: 24
tags:
- dpdp/third-party
---

# TP-DEMO-AWS - AWS (Mumbai region)

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-AWS]]
```
