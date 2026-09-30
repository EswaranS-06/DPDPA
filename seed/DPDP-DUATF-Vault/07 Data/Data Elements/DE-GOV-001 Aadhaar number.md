---
type: data_element
element_id: DE-GOV-001
title: Aadhaar number
category: gov_id
personal_data: true
context_tags:
- gov_id
note: 'Aadhaar Act: mask, vault, purpose-limited'
tags:
- dpdp/data-element
---

# DE-GOV-001 - Aadhaar number

Category: `gov_id` | Context: gov_id

Aadhaar Act: mask, vault, purpose-limited

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-GOV-001 Aadhaar number]])
```
