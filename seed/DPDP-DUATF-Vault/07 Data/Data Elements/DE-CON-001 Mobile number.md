---
type: data_element
element_id: DE-CON-001
title: Mobile number
category: contact
personal_data: true
context_tags: []
note: Identifier + channel
tags:
- dpdp/data-element
---

# DE-CON-001 - Mobile number

Category: `contact` | Context: -

Identifier + channel

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-CON-001 Mobile number]])
```
