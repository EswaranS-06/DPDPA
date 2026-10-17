---
id: N06
title: Notice for Personal Data Processed on Consent Obtained Before Commencement (Section 5(2))
category: 1. Data-principal-facing notices
audience: Existing customers / users whose consent pre-dates 13 May 2027
publish: public (email / SMS / in-app / postal campaign)
legal_basis: [DPDPA s.5(2), s.5(3), s.6(4); Rules r.3]
applies_when: Legacy-Data-Exists
flags: [Uses-Consent-Manager, Has-Mobile-App]
version: 1.0
review_cycle: one-time campaign; reuse for acquired databases
---

> **Drafting note:** Under s.5(2), where a Data Principal gave consent before the Act commenced, the Data Fiduciary must give a notice "as soon as it is reasonably practicable". It may keep processing until the Data Principal withdraws consent. Plan the campaign to finish around the 13 May 2027 commencement of s.5. Send the short message (Part A) through the channel the customer uses most, and link it to the full notice (Part B). Log delivery evidence for each recipient in C04 (`artefact_type = legacy_notice`). Personal data that is no longer needed should be **erased** before the campaign, not re-papered.

## PART A: SHORT MESSAGE

**Email subject / push title:** How [Client-Brand-Name] uses your personal data: your choices

**SMS (≤ 160 chars, DLT-registered template):**
[Client-Brand-Name]: We've updated how we explain use of your data under the DPDP Act. View or change your choices: [Short-Notice-URL]

**Email / in-app body:**
Dear [Data-Principal-First-Name],

You have been with [Client-Brand-Name] since [Customer-Since-Date]. When you signed up, you agreed to let us use your personal data to provide our services. India's Digital Personal Data Protection Act, 2023 now asks us to tell you clearly what we hold and why, and how you can control it.

**What we hold about you:** [Legacy-Data-Summary]
**Why we use it:** [Legacy-Purpose-Summary]

**Your choices:**
- Keep things as they are: you don't need to do anything.
- Review or withdraw any consent at [Consent-Preferences-URL]<!-- IF Has-Mobile-App --> or in the app under [App-Consent-Path]<!-- END IF -->. It is as easy as one tap.
- Ask for a summary of your data, correct it, erase it, or nominate someone: [Rights-Portal-URL].
- Questions or concerns: [Grievance-Officer-Email]. You may also complain to the Data Protection Board of India.

The full notice is at [Privacy-Notice-URL] and is available in [Notice-Languages].

Regards,
[Client-Name]

## PART B: FULL NOTICE (landing page)

<!-- INCLUDE public-header -->

# Notice about Your Existing Personal Data

### 1. Why you are receiving this
You gave us consent to process your personal data before the Digital Personal Data Protection Act, 2023 came into force. Under section 5(2) of the Act, we are now giving you this notice. We will continue to process your data on the basis of that earlier consent **until you withdraw it**.

### 2. Personal data we hold about you
| Category | Items |
|---|---|
<!-- REPEAT Legacy-Data-Categories -->
| [Category-Name] | [Data-Items] |
<!-- END REPEAT -->

### 3. Purposes for which we process it
| Purpose | What it enables | Can you withdraw consent and still use the core service? |
|---|---|---|
<!-- REPEAT Legacy-Purposes -->
| [Purpose-Name] | [Purpose-Service-Description] | [Purpose-Withdrawal-Impact] |
<!-- END REPEAT -->

### 4. How to withdraw consent
[Consent-Preferences-URL] · [App-Consent-Path] · [Grievance-Officer-Email] · [Support-Phone]<!-- IF Uses-Consent-Manager --> · Consent Manager: [Consent-Manager-Name]<!-- END IF -->.
After withdrawal we will stop processing for that purpose within [Withdrawal-Effect-Period] and erase the related data, unless the law requires us to keep it. Processing done before withdrawal remains lawful.

### 5. How to exercise your rights
Access, correction, completion, updating, erasure, nomination and grievance redressal are available at [Rights-Portal-URL]. Identify yourself with [Identifier-Types]. We respond to grievances within [Grievance-Resolution-Period].

### 6. How to complain to the Data Protection Board
<!-- INCLUDE board-complaint -->

### 7. Contact
<!-- INCLUDE contact-block -->
