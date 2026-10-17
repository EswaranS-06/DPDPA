---
id: C04
title: Consent Artefact (Log Record) & Consent Receipt
category: 2. Consent architecture
audience: Engineering, DPO office, Internal Audit
publish: internal schema; receipt is sent to the Data Principal
legal_basis: [DPDPA s.6(10) (burden of proof on Data Fiduciary), s.5, s.6(4), s.9(1); Rules r.3, r.6(1)(e), r.8(3), r.10]
applies_when: always
flags: [Uses-Consent-Manager, Processes-Children-Data]
version: 1.0
review_cycle: 12 months
---

<!-- INCLUDE doc-control -->

# Consent Artefact & Consent Receipt

## 1. Purpose
Under s.6(10), wherever a question arises in any proceeding, [Client-Name] must prove that it gave notice and that consent was obtained. The consent artefact is the immutable record that provides this proof. A new artefact is written for **every** consent event: given, denied, modified, withdrawn, renewed, legacy notice delivered, or VPC verified.

## 2. Principles
- **Append-only.** Events are never overwritten. The current state is derived from the sequence of events.
- **Notice-version binding.** Every artefact references the exact notice text shown, as a version ID plus a SHA-256 hash of the rendered text and language.
- **Minimisation.** Store a pseudonymous DP ID and identifiers only to the extent needed to link the artefact to the person.
- **Integrity.** Hash-chain or sign the records. Store them in a WORM-capable or tamper-evident store.
- **Retention.** [Consent-Record-Retention] after the purpose ends or the relationship closes, and never less than the limitation period for claims.

## 3. Artefact fields
| # | Field | Type | Mandatory | Description |
|---|---|---|:-:|---|
| 1 | `artefact_id` | UUID | ✔ | Unique ID |
| 2 | `event_type` | enum: given / denied / modified / withdrawn / renewed / legacy_notice / vpc_verified / guardian_verified | ✔ | Kind of event |
| 3 | `event_timestamp` | ISO 8601 with time zone (IST), NTP-synced | ✔ | When the event happened |
| 4 | `data_fiduciary` | string | ✔ | [Client-Name] (+ legal entity code) |
| 5 | `dp_pseudonymous_id` | string | ✔ | Internal ID of the Data Principal |
| 6 | `dp_identifier_type` / `dp_identifier_hash` | enum / hash | ✔ | e.g. mobile, email, customer ID (Rule 14(5)) |
| 7 | `actor` | enum: self / parent / lawful_guardian / nominee / consent_manager / agent_assisted | ✔ | Who acted |
| 8 | `purposes[]` | array of {purpose_id, status} | ✔ | Each purpose and its status |
| 9 | `data_items[]` | array | ✔ | Items covered by each purpose |
| 10 | `notice_id`, `notice_version`, `notice_hash` | string | ✔ | Exact notice shown |
| 11 | `notice_language` | ISO 639 | ✔ | Language displayed (s.5(3)) |
| 12 | `channel` | enum: web / app / call / paper / whatsapp / kiosk / consent_manager | ✔ | Where it happened |
| 13 | `capture_method` | enum: checkbox / toggle / button / OTP / e-sign / wet-signature / verbal-recorded | ✔ | Affirmative action used |
| 14 | `ui_version` / `script_version` | string | ✔ | Screen or script build |
| 15 | `device_fingerprint_hash`, `ip_hash` | hash | ○ | Technical evidence |
| 16 | `agent_id`, `call_recording_ref` | string | ○ (assisted) | Assisted channels |
| 17 | `paper_form_ref` | string | ○ (paper) | Scanned form reference |
| 18 | `consent_manager_id`, `cm_artefact_ref`, `cm_signature` | string | ○ (CM) | If routed via a CM |
| 19 | `vpc_method`, `vpc_token_issuer`, `vpc_reference_hash`, `adult_confirmed` | object | ○ (children) | Rule 10 evidence |
| 20 | `guardian_order_ref`, `guardian_authority` | object | ○ (disability) | Rule 11 evidence |
| 21 | `expiry_or_review_date` | date | ○ | When re-consent is due |
| 22 | `withdrawal_propagated_at`, `processor_acks[]` | timestamp / array | ○ (withdrawal) | C02 steps 5–6 |
| 23 | `previous_artefact_id` | UUID | ○ | Chain link |
| 24 | `record_hash` | SHA-256 | ✔ | Integrity hash (includes the previous hash) |

## 4. JSON schema (reference)
```json
{
  "artefact_id": "b3f1c2d4-...",
  "event_type": "given",
  "event_timestamp": "2027-05-20T10:15:32+05:30",
  "data_fiduciary": "[Client-Name]",
  "dp_pseudonymous_id": "DP-0001928",
  "dp_identifier_type": "mobile",
  "dp_identifier_hash": "sha256:…",
  "actor": "self",
  "purposes": [
    {"purpose_id": "P-MKT-01", "status": "granted"},
    {"purpose_id": "P-PERS-01", "status": "denied"}
  ],
  "data_items": {"P-MKT-01": ["name", "mobile", "email"]},
  "notice_id": "N01", "notice_version": "1.0", "notice_hash": "sha256:…",
  "notice_language": "hi",
  "channel": "app", "capture_method": "toggle", "ui_version": "app-5.2.0",
  "consent_manager_id": null,
  "previous_artefact_id": null,
  "record_hash": "sha256:…"
}
```

## 5. Consent receipt (sent to the Data Principal)
**Subject:** Your privacy choices with [Client-Brand-Name]: receipt [Receipt-No]

| Item | Detail |
|---|---|
| Date & time | [Event-Timestamp] |
| What you did | [Event-Type-Label] (e.g. "Gave consent" / "Withdrew consent") |
| Purposes | [Receipt-Purpose-List] (each marked ✓ allowed / ✗ not allowed) |
| Data covered | [Receipt-Data-Items] |
| Notice version | [Notice-Version] ([Notice-Language]) |
| Change your choices | [Consent-Preferences-URL] |
| Your rights | [Rights-Portal-URL] |
| Questions | [Privacy-Contact-Email] |
| Complaints | Grievance Officer [Grievance-Officer-Email]; Data Protection Board of India [DPB-Complaint-URL] |

Keep this receipt for your records. Reference: [Artefact-ID]

## 6. Reports the consent store must produce
1. **Proof pack**: for a given DP and date, show the notice text displayed, the artefacts and the receipts (used for s.6(10) defence and Board inquiries).
2. Active consents by purpose and notice version (used to target re-consent when a notice changes).
3. Withdrawal propagation latency (C02 KPIs).
4. Legacy-notice delivery coverage (N06).
5. VPC verifications by method (N05).
