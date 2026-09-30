---
type: tracker
---

# Rights Request Log

Target: internal SLA 30 days; statutory maximum 90 days (R14(3)).

Create entries from the matching template in `90 Templates`.

```dataview
TABLE right, received_on, due_by, closed_on, outcome
FROM -"90 Templates" WHERE type = "rights_request"
SORT file.name DESC
```
