---
type: data_element
element_id: DE-HLT-011
title: Wearable data (heart rate, sleep, steps)
category: health
personal_data: true
context_tags:
- health
note: ''
tags:
- dpdp/data-element
---

# DE-HLT-011 - Wearable data (heart rate, sleep, steps)

Category: `health` | Context: health



## Used in activities
```dataview
TABLE department, process FROM -"90 Templates" WHERE type = "processing_activity" AND contains(data_elements, [[DE-HLT-011 Wearable data (heart rate, sleep, steps)]])
```
