---
id: C03
title: Consent Manager Integration Note
category: 2. Consent architecture
audience: Product, Engineering, Legal, DPO office
publish: internal
legal_basis: [DPDPA s.2(g), s.6(7)–(9), s.27(1)(d); Rules r.4, First Schedule Parts A & B (in force 13 Nov 2026)]
applies_when: Uses-Consent-Manager
flags: [Uses-Consent-Manager]
version: 1.0
review_cycle: 12 months; on CM change
---

<!-- INCLUDE doc-control -->

# Consent Manager Integration Note

> **Drafting note:** Consent Manager registration (Rule 4 and the First Schedule) takes effect on **13 Nov 2026**. Data Fiduciaries are not required to use a Consent Manager, but they must honour consent given, managed or withdrawn through one (s.6(7)). First Schedule items below are paraphrased: **VERIFY** them against the Gazette.

## 1. Overview
| Item | Detail |
|---|---|
| Consent Manager | [Consent-Manager-Name], registration no. [Consent-Manager-Reg-No] with the Data Protection Board |
| Registration verified on | [CM-Verification-Date] (check the Board's published list) |
| Integration go-live | [CM-Go-Live-Date] |
| Purposes routed via CM | [CM-Purposes] |
| Channels | [CM-Channels] |
| Agreement ref. | [CM-Agreement-Ref] |

## 2. Legal position
- A Consent Manager is registered with the Board and is **accountable to the Data Principal**. It acts on the Data Principal's behalf (s.6(8)).
- A Data Principal may give, manage, review and withdraw consent to [Client-Name] **through** the Consent Manager (s.6(7)). [Client-Name] must act on a withdrawal received through the CM in the same way as a direct withdrawal (C02).
- [Client-Name] remains the Data Fiduciary and stays responsible for its compliance (s.8(1)). The burden of proving notice and consent stays on [Client-Name] (s.6(10)).

## 3. Due-diligence checks on the Consent Manager (First Schedule — **VERIFY**)
| # | Check | Evidence |
|---|---|---|
| 1 | A company incorporated in India | CIN |
| 2 | Registered with the Board; registration current, not suspended or cancelled | Board registry extract |
| 3 | Minimum net worth (₹2 crore under the First Schedule) | Latest audited financials |
| 4 | Platform is interoperable and independently certified | Certification report |
| 5 | Acts in a fiduciary capacity towards Data Principals, with conflict-of-interest safeguards against Data Fiduciaries | Policy / MoA provisions |
| 6 | Does not sub-contract or assign its obligations | Contract |
| 7 | Cannot read the personal data that flows through it (data-blind design) | Architecture note |
| 8 | Keeps records of consents given, denied and withdrawn, notices, and sharing, for the period the First Schedule prescribes (stated there as not less than seven years) | CM policy |
| 9 | Gives Data Principals access to their consent records in machine-readable form | Demo |
| 10 | Reasonable security safeguards, breach handling and audits | ISO 27001 / audit report |
| 11 | Publishes information about promoters, directors, key managerial personnel and significant shareholders | Website |

## 4. Integration architecture
```
Data Principal ──► CM app/portal ──(consent request: purpose IDs, notice version, DF ID)──► [Client-Name] consent API
      ▲                                                                                │
      └──── consent artefact (signed) ◄──────────── CM ◄──── consent request ──────────┘
[Client-Name] consent service ──► stores artefact + CM ref in consent log (C04) ──► enforces in systems
Withdrawal: DP ──► CM ──► webhook to [Client-Name] (/consent/withdraw) ──► C02 steps 2–9
```

### 4.1 Interface specification
| Interface | Direction | Payload (minimum) | SLA |
|---|---|---|---|
| Purpose catalogue publish | DF → CM | Purpose ID, description, data items, retention, notice version, languages | On change |
| Consent request | DF → CM | DP identifier (as agreed), purpose IDs, notice URL/hash | Real-time |
| Consent artefact | CM → DF | Artefact ID, DP pseudonymous ID, purposes, status, timestamp, CM signature | Real-time |
| Withdrawal / modification | CM → DF | Artefact ID, purposes withdrawn, timestamp | Real-time; DF acknowledges within [CM-Ack-SLA] |
| Status query | DF ↔ CM | Artefact ID | On demand |
| Grievance referral | CM ↔ DF | Ticket ID, nature | Per R01 |

### 4.2 Security
Mutual TLS, signed artefacts (JWS), replay protection, IP allow-listing, key rotation every [Key-Rotation-Period], and audit logs kept for at least 1 year (Rule 6).

## 5. Operational responsibilities (RACI)
| Activity | [Client-Name] | Consent Manager |
|---|---|---|
| Notice content & purpose definitions | A/R | C |
| Rendering consent UI in CM | C | R |
| Storing artefacts | R (own copy) | R |
| Acting on withdrawals | A/R | R (transmit) |
| Grievances about the CM platform | C | A/R |
| Grievances about processing by [Client-Name] | A/R | C |
| Breach in CM platform | Informed | A/R (to Board & DPs) |

## 6. Contract clauses to include with the CM
Service levels; artefact format and signature; uptime; transmission of withdrawals within [CM-Ack-SLA]; data-blind design; security and breach notification to [Client-Name] within [CM-Breach-Notice-Hours] hours; audit rights; exit assistance and artefact export; fee model; no use of [Client-Name]'s metadata for the CM's own purposes.

## 7. Fallback
If the CM is unavailable, users can still consent or withdraw directly through [Consent-Preferences-URL]. The two records are reconciled within 24 hours of restoration.
