---
id: B03
title: Personal Data Breach Intimation to Affected Data Principals (Rule 7(1))
category: 6. Breach management
audience: Each affected Data Principal
publish: public (individual communication via user account / registered email / SMS / post)
legal_basis: [DPDPA s.8(6); Rules r.7(1)(a)–(e)]
applies_when: every personal data breach affecting the Data Principal
flags: [Processes-Children-Data, Has-Mobile-App]
version: 1.0
review_cycle: annually
---

> **Drafting note:** Rule 7(1) requires the intimation to be given to **each** affected Data Principal, "in a concise, clear and plain manner and without delay", through their **user account** or the **mode of communication they registered**. It must contain the five elements (a)–(e) below. Send it in the language of the Data Principal's relationship with the client. For children, address the parent or guardian. Avoid jargon and minimising language. Don't include links that resemble phishing: tell people to go to the official site or app directly.

## Full intimation (email / letter / in-app)

**Subject:** Important: a security incident affecting your personal data at [Client-Brand-Name]

Dear [DP-Name],

We are writing to tell you about a security incident at [Client-Name] that involves your personal data.

**1. What happened** *(Rule 7(1)(a): nature, extent, timing)*
On [Breach-Occurred-At-Plain], [Breach-Plain-Description]. We discovered it on [Breach-Detected-At-Plain]. The personal data involved is: **[Breach-DP-Data-Items]**.<!-- IF Breach-Not-Involved-Statement --> The incident did **not** involve [Breach-Not-Involved-Data].<!-- END IF -->

**2. What this could mean for you** *(Rule 7(1)(b): likely consequences)*
[Breach-DP-Consequences]
(e.g. you may receive phishing emails or calls pretending to be from us; someone could try to use your details to open accounts or commit fraud.)

**3. What we have done and are doing** *(Rule 7(1)(c): mitigation measures)*
[Breach-DP-Mitigation]
(e.g. we stopped the unauthorised access, reset affected credentials, strengthened monitoring, reported the incident to the Data Protection Board of India and CERT-In, and are working with [authorities].)

**4. What you can do to protect yourself** *(Rule 7(1)(d): safety measures)*
- [Breach-DP-Safety-Step-1] (e.g. change your [Client-Brand-Name] password, and any other account where you use the same password)
- [Breach-DP-Safety-Step-2] (e.g. turn on two-factor authentication)
- Be careful of calls, SMS or emails asking for OTPs, passwords or payment. **[Client-Brand-Name] will never ask for your OTP or password.**
- [Breach-DP-Safety-Step-3] (e.g. watch your bank statements; if your card was involved, contact your bank to block it and reissue)
- If you suspect fraud, report it at cybercrime.gov.in or call 1930 (National Cyber Crime Helpline).
<!-- IF Breach-Support-Offered -->- We are offering you [Breach-Support-Offer] free of charge. To activate it: [Breach-Support-Instructions].<!-- END IF -->

**5. Who to contact** *(Rule 7(1)(e): business contact of a person who can respond)*
[Breach-DP-Contact-Name], [Breach-DP-Contact-Designation]
Email: [Breach-DP-Contact-Email] · Phone: [Breach-Helpline] ([Breach-Helpline-Hours])
FAQ: go to [Client-Website-URL] directly and select "Security Notice" (we are not including a clickable link, for your safety).

We are sorry this happened. Protecting your data is our responsibility, and we are taking steps to prevent it from happening again.

You may also raise a grievance with our Grievance Officer ([Grievance-Officer-Email]) and, after that, with the Data Protection Board of India.

Sincerely,
[Breach-Signatory-Name], [Breach-Signatory-Designation], [Client-Name]
Reference: [Breach-ID]

---

## Short SMS / push version (DLT-registered; points to the full notice)
[Client-Brand-Name]: A security incident involving your [Breach-DP-Data-Short] occurred on [Breach-Date-Short]. Details & steps to protect yourself are in your account / email. We never ask for OTPs. Help: [Breach-Helpline]

<!-- IF Has-Mobile-App -->
## In-app banner / inbox message
**Security notice:** We've detected an incident affecting your personal data. Tap to read what happened, what we're doing, and what you can do. → opens the full intimation
<!-- END IF -->

<!-- IF Processes-Children-Data -->
## Parent / guardian variant (child Data Principal)
Replace "your personal data" with "your child [Child-Name]'s personal data". Add advice that is specific to children (e.g. watch for anyone contacting your child online who claims to know personal details). Send it to the parent or guardian on record, never to the child alone.
<!-- END IF -->

## Delivery log (for B02 Part B (vi))
Record for every recipient: DP ID · channel · sent timestamp · delivery status · resend attempts · alternative mode used if undelivered.
