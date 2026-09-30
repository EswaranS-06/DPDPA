---
type: tracker
---

# Evidence Tracker

Evidence expiring within 60 days needs refresh.

Create entries from the matching template in `90 Templates`.

```dataview
TABLE status, collected_on, valid_until, controls
FROM -"90 Templates" WHERE type = "evidence"
SORT file.name DESC
```
