---
type: data_element
element_id: DE-EMP-001
title: Job title, department, manager
category: employment
personal_data: true
context_tags: []
note: ''
tags:
- dpdp/data-element
---

# DE-EMP-001 - Job title, department, manager

Category: `employment` | Context: -



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-EMP-001 Job title, department, manager]])
```
