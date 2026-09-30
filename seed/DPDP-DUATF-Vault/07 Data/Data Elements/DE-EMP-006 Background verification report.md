---
type: data_element
element_id: DE-EMP-006
title: Background verification report
category: background_check
personal_data: true
context_tags: []
note: May include criminal/court records
tags:
- dpdp/data-element
---

# DE-EMP-006 - Background verification report

Category: `background_check` | Context: -

May include criminal/court records

## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-EMP-006 Background verification report]])
```
