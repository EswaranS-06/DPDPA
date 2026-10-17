---
id: C02
title: Consent Withdrawal Mechanism & Standard Operating Procedure
category: 2. Consent architecture
audience: Customer support, Product, Engineering, Marketing, DPO office, Data Processors
publish: internal
legal_basis: [DPDPA s.6(4)–(6), s.8(7), s.8(2); Rules r.3(c)(i), r.8(3)]
applies_when: always
flags: [Uses-Consent-Manager, Has-Mobile-App, Marketing-Communications]
version: 1.0
review_cycle: 12 months
---

<!-- INCLUDE doc-control -->

# Consent Withdrawal SOP

## 1. Purpose
This SOP makes sure a Data Principal can withdraw consent **at any time**, with **ease comparable to giving it** (s.6(4), Rule 3(c)(i)). When that happens, [Client-Name] and its Data Processors **stop processing within a reasonable time** (s.6(6)) and **erase** the data unless the law requires it to be kept (s.8(7)).

## 2. Scope
All personal data that [Client-Name] processes on the basis of consent, in every channel: web, app, call centre, branches / stores / hospital desks, email, SMS, WhatsApp<!-- IF Uses-Consent-Manager -->, and the Consent Manager [Consent-Manager-Name]<!-- END IF -->. It does not cover processing under legitimate uses (s.7). Requests to stop that processing are handled as grievances (R01) or erasure requests (R02).

## 3. Roles
| Role | Responsibility |
|---|---|
| DPO / Privacy Office | Owns this SOP, monitors SLAs and approves exceptions |
| Consent Platform Owner ([Consent-Platform-Owner]) | Maintains the preference centre and the consent log, and propagates withdrawals to systems |
| Customer Support | Takes withdrawals over the phone or in person, records them, sends confirmation |
| Marketing Ops | Suppresses the contact on all campaign tools and syncs DND |
| System Owners | Stop the purpose-specific processing and erase data per G02 |
| Vendor Manager | Makes sure processors receive and confirm the withdrawal |

## 4. Withdrawal channels (published in N01 §9 and in every consent notice)
| Channel | How | Steps (must be ≤ steps used to give consent) |
|---|---|---|
| Preference centre | [Consent-Preferences-URL]: toggle off | 2 |
| App | [App-Consent-Path]: toggle off | 2–3 |
| Email | Unsubscribe link (one click, no login) / write to [Grievance-Officer-Email] | 1 |
| SMS | Reply [SMS-Optout-Keyword] | 1 |
| Phone | [Support-Phone] (IVR option [IVR-Withdraw-Option]) | Verbal |
| In person | Form W-1 at any [Client-Location-Type] | 1 form |
<!-- IF Uses-Consent-Manager -->
| Consent Manager | [Consent-Manager-Name] dashboard | As per CM |
<!-- END IF -->

## 5. Procedure
| Step | Action | Owner | SLA |
|---|---|---|---|
| 1 | Receive the withdrawal and identify the Data Principal using the identifiers already held (e.g. a logged-in session, the registered mobile with OTP). **Don't ask for more data than you need to identify the person.** | Channel | Immediate |
| 2 | Record the withdrawal in the consent log as a new artefact (`event = withdrawn`, purpose IDs, channel, timestamp). Never overwrite the original consent. | Consent platform | Real-time; paper / phone within [Paper-Consent-Digitisation-Period] |
| 3 | If withdrawal affects a service the user is receiving, show or read the impact statement: "If you withdraw consent for [purpose], we will no longer be able to [service]. Processing done until now remains lawful." Then ask the user to confirm. **Do not discourage, delay or confirm-shame.** | Channel | At the time |
| 4 | Send a confirmation receipt (C04 §5) by the same channel or the registered email / SMS | Consent platform | Within [Withdrawal-Confirmation-Period] |
| 5 | Propagate a suppression event to internal systems (CRM, CDP, marketing automation, analytics, data warehouse) via [Propagation-Mechanism] | Platform owner | Within [Withdrawal-Effect-Period] |
| 6 | Notify the Data Processors that process data for the withdrawn purpose to stop processing (API / SFTP / email), and get their acknowledgement | Vendor manager | Within [Processor-Withdrawal-SLA] |
| 7 | Erase or anonymise the data used only for the withdrawn purpose, according to the retention schedule (G02). Keep the minimum record (the consent artefact, plus logs for 1 year under Rule 8(3)) needed to prove compliance. | System owners | Within [Post-Withdrawal-Erasure-Period] |
| 8 | Exception: if the data must be kept under a law (tax, KYC, medical records), restrict it to that legal purpose and record the legal basis | DPO | Documented |
| 9 | Monthly reconciliation: compare suppression lists against campaign sends, and investigate any message sent after withdrawal as a potential incident | Privacy office | Monthly |

## 6. Service-impact matrix
| Purpose withdrawn | Effect on the Data Principal | Data action |
|---|---|---|
<!-- REPEAT Consent-Purposes -->
| [Purpose-Name] | [Purpose-Withdrawal-Impact] | [Purpose-Withdrawal-Data-Action] |
<!-- END REPEAT -->

## 7. Special cases
- **Withdrawal of a mandatory-for-service consent** (for example, the consent for treatment or for an account): treat it as service termination. Offer account closure and explain what data will be kept under law.
- **Child turning 18 / parent withdrawing**: stop the child-profile processing immediately and follow N05 C4.
- **Nominee withdrawing on behalf of a deceased or incapacitated Data Principal**: verify the nomination (R02 §5.5) first.
- **Withdrawal during an active transaction**: complete the processing that the transaction legally requires, such as invoicing or a refund, and stop the rest.

## 8. Form W-1: Withdrawal of Consent (paper / counter)
Name: ____________  Registered mobile / customer ID: ____________
I withdraw my consent for: ☐ [Purpose-1] ☐ [Purpose-2] ☐ [Purpose-3] ☐ All optional purposes
I understand that processing carried out before this withdrawal remains lawful, and that [service impact, if any] may apply.
Signature: ________ Date / time: ________ Received by (staff ID): ________ Log ref.: ________

## 9. KPIs
- % of withdrawals propagated within SLA (target 100%)
- Number of communications sent after withdrawal (target 0)
- Median time from withdrawal to processor acknowledgement
- Withdrawals by channel and by purpose (feeds product / UX review)

## 10. Records
The consent log and the withdrawal artefacts are kept for [Consent-Record-Retention] after the relationship ends, as evidence under s.6(10).
