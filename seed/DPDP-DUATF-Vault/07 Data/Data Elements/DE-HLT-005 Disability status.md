---
type: data_element
element_id: DE-HLT-005
title: Disability status
category: health
personal_data: true
context_tags:
- health
note: Also PwD guardian logic
tags:
- dpdp/data-element
---

# DE-HLT-005 - Disability status

Category: `health` | Context: health

Also PwD guardian logic

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-HLT-005 Disability status]])
```
