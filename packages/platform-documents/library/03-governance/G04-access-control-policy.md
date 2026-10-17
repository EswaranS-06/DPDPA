---
id: G04
title: Access Control Policy for Personal Data Systems
category: 3. Internal governance policies
audience: IT, Information Security, system owners, HR, all users
publish: internal
legal_basis: [DPDPA s.8(4), s.8(5); Rules r.6(1)(a)–(g); CERT-In Directions 2022; ISO/IEC 27001:2022 Annex A 5.15–5.18, 8.2–8.5, 8.15–8.16]
applies_when: always
flags: [Sector, Cross-Border-Transfer]
version: 1.0
review_cycle: annually
---

<!-- INCLUDE doc-control -->

# Access Control Policy (Personal Data Systems)

## 1. Purpose
To ensure that only authorised people, for authorised purposes, can access personal data, and that every access is visible, logged and reviewable. This implements Rule 6(1)(b) (access control) and Rule 6(1)(c) (visibility through logs, monitoring and review).

## 2. Scope
Every system, application, database, file share, SaaS tool, endpoint and paper store that holds L3 or L4 personal data (G03), whether operated by [Client-Name] or by a Data Processor on its behalf.

## 3. Principles
Need-to-know · Least privilege · Segregation of duties · Default deny · Purpose-bound access (access is tied to a RoPA purpose) · Accountability (named IDs; no shared accounts).

## 4. Identity lifecycle
| Stage | Requirement | SLA |
|---|---|---|
| Joiner | Access is provisioned only on an approved request (manager + system owner), mapped to a role in the role matrix | Before start date |
| Mover | Old access is revoked and new access re-approved | Within [Mover-SLA] |
| Leaver | All access disabled; credentials, tokens and devices recovered | Within [Leaver-SLA] of exit (immediately for terminations) |
| Contractors / vendors | Time-bound accounts with an expiry date ≤ contract end; sponsor named | — |
| Dormant accounts | Disabled after [Dormant-Account-Days] days of inactivity | Automated |

## 5. Authentication
- Unique user IDs. Shared and generic accounts are prohibited (or vaulted, with check-out logging, where they are technically unavoidable).
- **MFA** for all remote access, all privileged access, all access to L4 data, and all admin consoles for cloud and SaaS.
- Password standard: [Password-Standard] (minimum 12 characters or passphrase; screened against breached-password lists; no forced periodic rotation unless compromise is suspected).
- Service accounts: non-interactive; secrets kept in a vault; rotated every [Secret-Rotation-Period].

## 6. Authorisation
- Role-based access control (RBAC) matrix per system: role, data-classification level, permissions, approver. Maintained in [IAM-Tool].
- Attribute-based restrictions for L4 data: by location, by device posture, and by row or field (e.g. a call-centre agent sees masked PAN / Aadhaar).
- **Privileged access management (PAM)** for DBAs, sysadmins and cloud admins: just-in-time elevation, session recording, approval workflow.
- Production data in non-production environments is prohibited unless it has been masked or anonymised (G03).
- Bulk export or download of personal data (more than [Bulk-Threshold-Records] records) needs DPO / owner approval and is logged and watched by DLP.

## 7. Access reviews
| Scope | Frequency | Reviewer |
|---|---|---|
| L4 systems: user access | Quarterly | System owner + DPO office |
| L3 systems | Half-yearly | System owner |
| Privileged accounts | Quarterly | CISO |
| Vendor / third-party accounts | Quarterly | Vendor sponsor |
Exceptions are remediated within [Access-Review-Remediation-Days] days. Evidence is kept for audit.

## 8. Encryption and data protection controls (Rule 6(1)(a))
Encryption in transit and at rest, plus masking, obfuscation or tokenisation (virtual tokens mapped to personal data) as G03 sets out per level. Key management is done in an HSM / KMS, with segregation of key custodians.

## 9. Logging, monitoring and review (Rule 6(1)(c),(e))
- Log authentication events, access to L3/L4 records (read, write, export, delete), privilege changes, configuration changes, and admin actions.
- Centralise logs in [SIEM-Tool]. Synchronise clocks to NTP (CERT-In requirement).
- **Keep logs for at least 1 year** (Rule 6(1)(e); Rule 8(3)). ICT logs are kept 180 days in India under CERT-In.
- Use-case alerts: abnormal volume access, out-of-hours access to L4 data, access by leavers, mass deletion, impossible travel.
- Monthly review of privileged-activity reports. Every alert is triaged within [Alert-Triage-SLA].

## 10. Continuity (Rule 6(1)(d))
Backups of personal-data systems follow [Backup-Policy-Name]: encrypted, access-restricted, restore-tested every [Restore-Test-Frequency]. RPO/RTO are defined per system.

## 11. Data Processor access (Rule 6(1)(f))
Processors that access Company systems must use named accounts with MFA and follow this Policy. Processors that host data must contractually implement equivalent controls (V01 Annex 2). Access is reviewed quarterly.

## 12. Physical access
Areas holding L4 data or paper records (data centres, records rooms, HR and medical records) have badge access, visitor logs and CCTV, and their access lists are reviewed quarterly.

## 13. Enforcement and exceptions
Exceptions need risk acceptance from the CISO and DPO, with an expiry of no more than 6 months. Violations are handled under the disciplinary policy.
