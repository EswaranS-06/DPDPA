---
type: data_element
element_id: DE-ID-002
title: Date of birth / age
category: identity
personal_data: true
context_tags:
- children
note: Drives child detection
tags:
- dpdp/data-element
---

# DE-ID-002 - Date of birth / age

Category: `identity` | Context: children

Drives child detection

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-ID-002 Date of birth - age]])
```
