---
id: R04
title: Rights & Grievance Response Letter Templates (L-01 to L-10)
category: 5. Data principal rights handling
audience: Data Principals (sent by email / portal / post)
publish: public (individual communications)
legal_basis: [DPDPA s.6(4), s.11, s.12, s.13, s.14; Rules r.8(2), r.9, r.14]
applies_when: always (L-08 only if Third-Schedule-Entity != None)
flags: [Is-SDF, Third-Schedule-Entity]
version: 1.0
review_cycle: annually
---

> **Drafting note:** Rule 9 requires every response to a communication in which a Data Principal exercises a right to include the business contact information of the DPO, or of the person designated to answer questions. The `contact-footer` below is therefore mandatory in **every** letter. Variables specific to a letter: [DP-Name], [Ticket-No], [Request-Date], [Request-Type], [Due-Date], [Response-Date].

### contact-footer (append to every letter)
---
Reference: [Ticket-No] · [Client-Name]
<!-- IF Is-SDF -->Data Protection Officer: [DPO-Name], [DPO-Email], [DPO-Phone]<!-- END IF --><!-- IF NOT Is-SDF -->For questions about processing of your personal data: [Privacy-Contact-Name], [Privacy-Contact-Email], [Privacy-Contact-Phone]<!-- END IF -->
Grievance Officer: [Grievance-Officer-Name], [Grievance-Officer-Email], [Grievance-Officer-Phone]
If you are not satisfied, you may complain to the Data Protection Board of India at [DPB-Complaint-URL] after using our grievance process.

---

## L-01: Acknowledgement
**Subject:** We have received your request [Ticket-No]
Dear [DP-Name],
Thank you for contacting [Client-Name]. We received your **[Request-Type]** request on [Request-Date]. Your reference number is **[Ticket-No]**. We will respond by **[Due-Date]**. If we need anything more from you, we will contact you at this address.
*(contact-footer)*

## L-02: Verification / more information needed
**Subject:** Action needed to process your request [Ticket-No]
Dear [DP-Name],
To protect your data, we need to confirm your identity before we act on your request. Please [Verification-Action] by [Verification-Deadline]. We only need this to verify you, and we will not use it for anything else. If we do not hear from you by then, we will close the request. You can submit it again at any time.
*(contact-footer)*

## L-03: Access to information (s.11)
**Subject:** Your personal data summary [Ticket-No]
Dear [DP-Name],
As you requested, here is a summary of the personal data that [Client-Name] processes about you.
**1. Personal data we process:** [Access-Data-Summary]
**2. How we use it (processing activities):** [Access-Processing-Summary]
**3. Who we have shared it with:**
| Recipient | Role (Data Fiduciary / Data Processor) | Data shared |
|---|---|---|
<!-- REPEAT Access-Recipients -->
| [Access-Recipient-Name] | [Access-Recipient-Role] | [Access-Recipient-Data] |
<!-- END REPEAT -->
**4. Other information:** [Access-Other-Info]

The detailed report is available at [Secure-Download-Link] until [Link-Expiry] (password sent separately). This summary does not include sharing with authorities that are legally authorised to receive information for preventing, detecting or investigating offences or cyber incidents, as section 11(2) of the Act allows.
You can correct, update or delete your data, or withdraw consent, at [Rights-Portal-URL].
*(contact-footer)*

## L-04: Correction / completion / update done (s.12(2))
**Subject:** Your data has been updated [Ticket-No]
Dear [DP-Name],
We have **[corrected / completed / updated]** the following: [Correction-Details], effective [Response-Date]. We have also told our service providers and any other organisation we disclosed this data to, so that their records match.
*(contact-footer)*

## L-05: Erasure done (s.12(3))
**Subject:** Your data has been deleted [Ticket-No]
Dear [DP-Name],
As you requested, we have erased: [Erased-Data-Description] from our systems and instructed our service providers to do the same.
<!-- IF Partial-Retention -->We have kept the following, because the law requires us to: [Retained-Data-Description] under [Retention-Legal-Reference], until [Retention-End-Date]. We will use it only for that legal purpose.<!-- END IF -->
For security, records (logs) of past processing are kept for one year from the date of processing, as Rule 8(3) of the Digital Personal Data Protection Rules, 2025 requires, and are then deleted.
*(contact-footer)*

## L-06: Request declined or partially fulfilled
**Subject:** Update on your request [Ticket-No]
Dear [DP-Name],
We have carefully considered your request. We are unable to [fully] [Request-Type] because: **[Refusal-Reason]** ([Refusal-Legal-Basis]).
[What-We-Did-Instead]
If you disagree, you can ask for a review by replying to this email or writing to our Grievance Officer. We will complete the review within [Grievance-Escalation-Period].
*(contact-footer)*

## L-07: Nomination registered (s.14)
**Subject:** Your nominee has been registered [Ticket-No]
Dear [DP-Name],
We have registered **[Nominee-Name]** ([Nominee-Relationship]) as your nominee under section 14 of the Digital Personal Data Protection Act, 2023, effective [Response-Date]. If you die or become incapable, your nominee may exercise your rights about your personal data with us on producing the required proof. You can change or cancel this nomination at any time at [Rights-Portal-URL].
*(contact-footer)*

<!-- IF Third-Schedule-Entity != None -->
## L-08: Prior intimation of erasure for inactivity (Rule 8(2)), sent ≥ 48 hours before the period ends
**Subject:** Your [Client-Brand-Name] data will be deleted on [Erasure-Date]
Dear [DP-Name],
You have not used your [Client-Brand-Name] account, or contacted us, since [Last-Activity-Date]. As the Digital Personal Data Protection Rules, 2025 require, we will erase your personal data on **[Erasure-Date]**.
**If you want to keep your account, simply log in at [Login-URL], or contact us, before [Erasure-Date] [Erasure-Time].**
Data needed for you to access your account, and any balance, wallet, gift card or other stored value issued by us, will not be erased. Any data we must keep under law will be retained only for that purpose.
*(contact-footer)*
<!-- END IF -->

## L-09: Grievance resolution (s.13)
**Subject:** Resolution of your grievance [Ticket-No]
Dear [DP-Name],
Thank you for raising your concern on [Request-Date] about **[Grievance-Summary]**.
**What we found:** [Grievance-Findings]
**What we have done:** [Grievance-Actions]
**What happens next:** [Grievance-Next-Steps]
If you are not satisfied with this resolution, you may ask for a review by [Escalation-Authority] within [Grievance-Review-Window], or file a complaint with the Data Protection Board of India at [DPB-Complaint-URL].
*(contact-footer)*

## L-10: Consent withdrawal confirmation (s.6(4))
**Subject:** Your consent choices have been updated
Dear [DP-Name],
On [Request-Date] you withdrew your consent for: **[Withdrawn-Purposes]**. We will stop processing your data for these purposes by [Withdrawal-Effective-Date], and our service providers will do the same. Processing carried out before your withdrawal remains lawful. [Withdrawal-Service-Impact]
You can change your choices at any time at [Consent-Preferences-URL].
*(contact-footer)*
