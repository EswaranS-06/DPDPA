---
type: data_element
element_id: DE-DEV-001
title: IP address
category: device_online
personal_data: true
context_tags: []
note: ''
tags:
- dpdp/data-element
---

# DE-DEV-001 - IP address

Category: `device_online` | Context: -



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-DEV-001 IP address]])
```
