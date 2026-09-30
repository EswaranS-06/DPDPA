---
type: system
system_id: SYS-DEMO-ATS
title: Applicant Tracking System
system_type: HRMS/Payroll
sanctioned: true
owner: ''
hosting: SaaS - India hosted
country: India
encryption_at_rest: 'yes'
access_logging: unknown
rights_lookup_key: email
tags:
- dpdp/system
---

# SYS-DEMO-ATS - Applicant Tracking System

## Activities using this system
```dataview
LIST FROM -"90 Templates" WHERE type = "processing_activity" AND contains(systems, [[SYS-DEMO-ATS]])
```
## Flows from this system
```dataview
TABLE to, transfer_type, country FROM -"90 Templates" WHERE type = "data_flow" AND from_system = [[SYS-DEMO-ATS]]
```
