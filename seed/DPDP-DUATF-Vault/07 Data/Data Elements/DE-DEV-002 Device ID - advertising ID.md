---
type: data_element
element_id: DE-DEV-002
title: Device ID / advertising ID
category: device_online
personal_data: true
context_tags: []
note: ''
tags:
- dpdp/data-element
---

# DE-DEV-002 - Device ID / advertising ID

Category: `device_online` | Context: -



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-DEV-002 Device ID - advertising ID]])
```
