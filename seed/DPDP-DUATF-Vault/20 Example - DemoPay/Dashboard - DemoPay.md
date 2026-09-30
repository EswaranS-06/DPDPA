---
type: dashboard
---

# DemoPay dashboard

## Activities & engine results
```dataview
TABLE applicable_count AS "Applicable", not_applicable_count AS "N/A" FROM "11 Assessments/Engine Output" WHERE contains(string(activity), "DEMO")
```

## System -> activities (graph view in table form)
```dataview
TABLE rows.file.link AS Activities FROM "20 Example - DemoPay/Activities" FLATTEN systems AS sys GROUP BY sys
```

## Third party -> activities
```dataview
TABLE rows.file.link AS Activities FROM "20 Example - DemoPay/Activities" FLATTEN third_parties AS tp GROUP BY tp
```

## Findings
```dataview
TABLE severity, risk_score, owner, status FROM "20 Example - DemoPay/Findings" SORT risk_score DESC
```
