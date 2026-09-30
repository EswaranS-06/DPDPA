---
type: third_party
tp_id: TP-DEMO-KYC
name: KYC & liveness vendor
third_party_type: KYC/verification vendor
processing_role:
- data_processor
country: India
dpa_status: signed
dpa_r6_security: true
breach_notify_sla_hours: 24
tags:
- dpdp/third-party
---

# TP-DEMO-KYC - KYC & liveness vendor

## Inbound flows
```dataview
TABLE from_system, activity, transfer_type FROM -"90 Templates" WHERE type = "data_flow" AND to = [[TP-DEMO-KYC]]
```
