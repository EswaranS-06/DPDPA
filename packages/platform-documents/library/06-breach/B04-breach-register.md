---
id: B04
title: Personal Data Breach Register / Incident Log
category: 6. Breach management
audience: DPO, CISO, Internal Audit, Board (on request)
publish: internal (producible to the Board)
legal_basis: [DPDPA s.8(5),(6), s.33(2); Rules r.6(1)(c),(e), r.7]
applies_when: always
flags: []
version: 1.0
review_cycle: continuous; monthly review by DPO; quarterly to Steering Committee
---

<!-- INCLUDE doc-control -->

# Personal Data Breach Register

The register records **every** suspected and confirmed personal data breach, including those found not to be breaches, together with the reasoning. CSV layout: `registers/breach-register.csv`. Retention: [Breach-Record-Retention].

## Register fields
| # | Field | Description |
|---|---|---|
| 1 | Breach ID | [Client-Short-Code]-PDB-YYYY-NNN |
| 2 | Reported by / channel | Employee, processor, Data Principal, researcher, SOC alert |
| 3 | Date-time reported | |
| 4 | Date-time of awareness (T0) | Start of the 72-hour clock |
| 5 | Date-time occurred (or window) | |
| 6 | Date-time contained | |
| 7 | Classification | Confirmed breach / Not a personal data breach (give reason) / Under assessment |
| 8 | Nature | Confidentiality / integrity / availability; type (ransomware, misdelivery, unauthorised access, loss, insider…) |
| 9 | Systems / location / processor | |
| 10 | Data categories & items | Mark L4 |
| 11 | Data Principal categories | Incl. children Y/N |
| 12 | No. of Data Principals / records | |
| 13 | Severity (S1–S4) | B01 §6 |
| 14 | Likely impact | |
| 15 | Root cause | |
| 16 | Person responsible (findings) | |
| 17 | Containment & mitigation actions | |
| 18 | Remedial actions (with owners and dates) | |
| 19 | CERT-In report: Y/N, timestamp, reference | |
| 20 | Board initial intimation: timestamp, reference | Rule 7(2)(a) |
| 21 | Board detailed report: timestamp, reference; extension Y/N | Rule 7(2)(b) |
| 22 | Data Principal intimation: count notified, modes, timestamps | Rule 7(1) |
| 23 | Other notifications (sector regulator, police, insurer, clients) | |
| 24 | Board inquiry / proceedings / voluntary undertaking | s.28, s.32 |
| 25 | Post-incident review date & lessons learned | |
| 26 | Status / closure date / closed by | |

## Register
| ID | T0 | Nature | Data / DPs affected | Severity | CERT-In | Board initial | Board 72h | DPs notified | Root cause | Status |
|---|---|---|---|---|---|---|---|---|---|---|
<!-- REPEAT Breaches -->
| [Breach-ID] | [Breach-Aware-At] | [Breach-Nature] | [Breach-Data-Categories] / [Breach-DP-Count] | [Breach-Severity] | [Breach-CERTIN-Ref] | [Board-Initial-Timestamp] | [Board-Detailed-Timestamp] | [Breach-DP-Notified-Count] | [Breach-Root-Cause] | [Breach-Status] |
<!-- END REPEAT -->

## KPIs (quarterly)
- Median time from T0 to Board initial intimation
- % of detailed reports filed within 72 h (target 100%)
- % of affected Data Principals notified, and the median time to notify
- Recurring root causes; open remedial actions past their due date
