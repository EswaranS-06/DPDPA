---
type: data_element
element_id: DE-DEV-007
title: Phone contacts list
category: contact
personal_data: true
context_tags: []
note: Non-user PD; prohibited for digital lending
tags:
- dpdp/data-element
---

# DE-DEV-007 - Phone contacts list

Category: `contact` | Context: -

Non-user PD; prohibited for digital lending

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-DEV-007 Phone contacts list]])
```
