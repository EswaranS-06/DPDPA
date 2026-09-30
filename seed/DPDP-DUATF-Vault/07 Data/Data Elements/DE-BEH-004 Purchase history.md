---
type: data_element
element_id: DE-BEH-004
title: Purchase history
category: transaction
personal_data: true
context_tags: []
note: ''
tags:
- dpdp/data-element
---

# DE-BEH-004 - Purchase history

Category: `transaction` | Context: -



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-BEH-004 Purchase history]])
```
