---
type: data_element
element_id: DE-ID-004
title: Photograph
category: identity
personal_data: true
context_tags: []
note: Face image; template = biometric
tags:
- dpdp/data-element
---

# DE-ID-004 - Photograph

Category: `identity` | Context: -

Face image; template = biometric

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-ID-004 Photograph]])
```
