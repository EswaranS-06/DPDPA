---
id: R01
title: Grievance Redressal Policy & Published Grievance Officer Contact
category: 5. Data principal rights handling
audience: Public (Part B published); internal (Part A)
publish: internal policy + public contact page
legal_basis: [DPDPA s.8(9), s.8(10), s.13, s.15(d); Rules r.9, r.14(3); IT Act s.43A / SPDI Rules r.5(9) (until 13 May 2027)]
applies_when: always
flags: [Is-SDF, Uses-Consent-Manager]
version: 1.0
review_cycle: annually
---

<!-- INCLUDE doc-control -->

# PART A: GRIEVANCE REDRESSAL POLICY (internal)

## 1. Purpose
To give every Data Principal a readily available, effective way to raise grievances about [Client-Name]'s processing of their personal data or its performance of its obligations under the Act (s.13(1)), and to resolve them within the published period (Rule 14(3)).

## 2. Scope
Grievances about any act or omission of [Client-Name], its Data Processors<!-- IF Uses-Consent-Manager --> or the Consent Manager in relation to [Client-Name]<!-- END IF -->, in relation to: notice, consent, withdrawal, rights requests (access, correction, erasure, nomination), security incidents, children's data, marketing communications, and any other obligation under the Act or Rules.

## 3. Principles
Accessible (multi-channel, free, in the Data Principal's language) · Fair · Timely · Confidential · No retaliation · Root-cause driven · Recorded.

## 4. Roles
| Role | Responsibility |
|---|---|
| Grievance Officer ([Grievance-Officer-Name]) | Owns the redressal process; decides on grievances; signs final responses; reports monthly |
| <!-- IF Is-SDF -->DPO (point of contact for the grievance redressal mechanism, s.10(2)(a))<!-- END IF --><!-- IF NOT Is-SDF -->Privacy Officer<!-- END IF --> | Oversight; handles escalated and complex grievances; links grievances with DPIAs and incidents |
| Grievance desk / L1 | Logs, acknowledges and triages grievances, and collects information |
| Function SPOCs | Investigate and fix the issue within the SLA |
| Legal | Advises on disputes, statutory carve-outs, and Board correspondence |

## 5. Channels (published, Part B)
Online form [Grievance-Portal-URL] · Email [Grievance-Officer-Email] · Phone [Grievance-Officer-Phone] · Post / in person to [Grievance-Officer-Address] · In-app: [App-Grievance-Path]<!-- IF Uses-Consent-Manager --> · Via Consent Manager [Consent-Manager-Name]<!-- END IF -->.

## 6. Process
| Stage | Action | Timeline |
|---|---|---|
| 1. Receipt | Log in the grievance register with a unique ticket number; capture the channel, date and time | Same day |
| 2. Acknowledge | Send an acknowledgement with the ticket number, the expected resolution date, and the contact details of the person who can answer questions (Rule 9) | Within [Grievance-Ack-Period] |
| 3. Verify | Confirm identity in proportion to the request, using the identifiers already held (Rule 14(1)(b)). Ask for missing information once, clearly. | Within [Grievance-Verify-Period] |
| 4. Classify | Category (consent / rights / marketing / security / children / other); priority (P1: ongoing harm, a children's data issue or a suspected breach → also trigger B01) | At triage |
| 5. Investigate | The function SPOC investigates and proposes a remedy | Within [Grievance-Investigate-Period] |
| 6. Resolve | Grievance Officer decides; sends a reasoned written response (what was found, the action taken, and how to escalate) | Within **[Grievance-Resolution-Period]** of receipt (≤ 90 days, Rule 14(3)) |
| 7. Internal escalation | If the Data Principal is dissatisfied, a review by the <!-- IF Is-SDF -->DPO<!-- END IF --><!-- IF NOT Is-SDF -->[Escalation-Authority]<!-- END IF --> | Within [Grievance-Escalation-Period] |
| 8. Close | The response tells the Data Principal of their right to complain to the Data Protection Board of India | On closure |
| 9. Learn | Root-cause analysis for recurring themes; corrective action logged | Monthly |

The total time from receipt to final response, including any internal escalation, must not exceed **[Grievance-Resolution-Period]**.

## 7. Published response period (Rule 14(3))
[Client-Name] publishes, prominently on its website and app, that it responds to grievances within **[Grievance-Resolution-Period]**. It has implemented appropriate technical and organisational measures to meet this period: ticketing with SLA timers, auto-escalation at [Grievance-Auto-Escalation-Trigger], and staffing reviews.

> **Drafting note:** Rule 14(3) sets an outer limit of **90 days**. Market practice is much shorter: many Indian entities publish a 24–48-hour acknowledgement and resolution within 15–30 days. One BPO's DPDP addendum, for example, commits to acknowledgement within 24 hours and resolution of general complaints within 15 days. Recommended default: acknowledgement in 2 working days, resolution in 30 days. Sector regulators may impose shorter timelines (e.g. RBI Integrated Ombudsman, IRDAI), so align with the stricter one.

## 8. Board complaints
Under s.13(3), a Data Principal must exhaust this mechanism before approaching the Board. If the Board receives a complaint or issues a notice, Legal and the Grievance Officer coordinate the response through the Board's digital office within the time the Board specifies, and preserve all records.

## 9. Frivolous or false grievances
A Data Principal must not register a false or frivolous grievance (s.15(d)). Even so, every grievance is assessed on its merits. A grievance is never closed as "frivolous" without a reasoned response approved by the Grievance Officer.

## 10. Records and MIS
The grievance register (`registers/rights-request-log.csv`, type = grievance) is kept for [Rights-Record-Retention]. A monthly MIS report goes to the Privacy Steering Committee: volumes, categories, SLA compliance, ageing, escalations and Board complaints.

---

# PART B: PUBLISHED GRIEVANCE OFFICER & CONTACT PAGE (public — Rule 9, Rule 14)

<!-- INCLUDE public-header -->

## Grievance Redressal & Privacy Contact

If you have a concern about how **[Client-Name]** handles your personal data, we want to hear from you.

<!-- INCLUDE contact-block -->

### How to raise a grievance
- **Online:** [Grievance-Portal-URL]
- **Email:** [Grievance-Officer-Email]
- **Phone:** [Grievance-Officer-Phone] ([Grievance-Working-Hours])
- **Post / in person:** Grievance Officer, [Client-Name], [Grievance-Officer-Address]

To help us identify you, please include: your name, [Identifier-Types] (e.g. registered mobile number, email or customer ID), a description of your concern, and any supporting documents.

### Our commitment
- **Acknowledgement:** within [Grievance-Ack-Period]
- **Resolution:** within **[Grievance-Resolution-Period]** of receiving your grievance
- If we need more information, we will ask you once, clearly.

### To exercise your rights
Access, correction, completion, updating, erasure, nomination and withdrawal of consent: [Rights-Portal-URL].

### Not satisfied?
<!-- INCLUDE board-complaint -->

*Last updated: [Last-Updated-Date]*
