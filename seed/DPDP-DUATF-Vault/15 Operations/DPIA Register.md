---
type: tracker
---

# DPIA Register

Mandatory annually for SDFs (R13(1)); good practice for high-risk activities.

Create entries from the matching template in `90 Templates`.

```dataview
TABLE scope_activities, date, residual_risk, approved_by
FROM -"90 Templates" WHERE type = "dpia"
SORT file.name DESC
```
