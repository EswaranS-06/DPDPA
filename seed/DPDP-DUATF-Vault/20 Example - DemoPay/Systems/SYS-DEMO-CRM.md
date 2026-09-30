---
type: system
system_id: SYS-DEMO-CRM
title: Salesforce CRM
system_type: CRM
sanctioned: true
owner: ''
hosting: SaaS - outside India
country: USA/Singapore
encryption_at_rest: 'yes'
access_logging: 'yes'
rights_lookup_key: mobile, email
tags:
- dpdp/system
---

# SYS-DEMO-CRM - Salesforce CRM

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-CRM]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-CRM]]
```
