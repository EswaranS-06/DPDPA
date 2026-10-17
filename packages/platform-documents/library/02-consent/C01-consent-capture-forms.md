---
id: C01
title: Consent Capture Forms & Flows (Purpose-wise, Itemised)
category: 2. Consent architecture
audience: Product, UX, Engineering, Marketing, Legal; renders public consent screens
publish: internal spec + public UI copy
legal_basis: [DPDPA s.4, s.5(1),(3), s.6(1)–(3),(10), s.7(a), s.9; Rules r.3, r.10]
applies_when: always (any consent-based processing)
flags: [Processes-Children-Data, Uses-Consent-Manager, Has-Mobile-App, Marketing-Communications]
version: 1.0
review_cycle: on every new purpose / journey; yearly review
---

<!-- INCLUDE doc-control -->

# Consent Capture Forms & Flows

## 1. Objective
To make sure every consent [Client-Name] relies on is **free, specific, informed, unconditional and unambiguous, given by a clear affirmative action**, and limited to the personal data necessary for the specified purpose (s.6(1)). Each consent must be provable (s.6(10)).

## 2. Lawful-basis decision tree (run this before designing any consent)
1. Is the processing needed to comply with a law, a court order, a medical emergency, an epidemic, a disaster, or an employment purpose? If **yes**, it is a **legitimate use (s.7)**. Do **not** ask for consent: give a transparency notice instead.
2. Is the Data Principal **voluntarily providing** data for a specific purpose they initiated, and have they not said they object (for example, giving a phone number to receive a delivery update)? If **yes**, s.7(a) applies. Show a short purpose statement at collection.
3. Otherwise, it is **consent**: design it under Section 3.
4. Is the Data Principal a child, or a person with disability acting through a guardian? If **yes**, use the **verifiable consent** flow (N05).

## 3. Design rules (validator checks every flow against these)
| # | Rule | Source |
|---|---|---|
| 3.1 | One purpose = one consent control. Never bundle "Terms of Use + Privacy + Marketing" into one checkbox. | s.6(1) "specific" |
| 3.2 | Controls are **unticked / off by default**. Silence, scrolling, inactivity or continued use is not consent. | s.6(1) "clear affirmative action" |
| 3.3 | No denial of a service for refusing consent to a purpose that the service does not need. | s.6(1) "free", "unconditional" |
| 3.4 | No clause that waives rights or conflicts with the Act. Any such clause is invalid to that extent. | s.6(2) |
| 3.5 | The notice is shown **with or before** the consent request. It stands on its own, is itemised, and gives the withdrawal / rights / Board links. | s.5(1), Rule 3 |
| 3.6 | Language choice: English + [Notice-Languages]. The language shown is logged. | s.5(3), s.6(3) |
| 3.7 | The DPO / privacy contact is shown on the consent screen. | s.6(3) |
| 3.8 | Collect only the data items needed for that purpose. | s.6(1) |
| 3.9 | Withdrawal is possible in the same channel and with no more steps than giving consent. | s.6(4), Rule 3(c)(i) |
| 3.10 | Every consent event creates a consent artefact (C04). | s.6(10) |
| 3.11 | No dark patterns: equal-weight Accept/Decline, no confirm-shaming, no false urgency, no nagging. | CCPA Dark Patterns Guidelines 2023 |
| 3.12 | A change of purpose or new data item means fresh consent. Notice-version changes are tracked. | s.6(1), s.5 |
| 3.13 | Children: verifiable parental consent before processing. No ad/behavioural purposes offered at all. | s.9, Rule 10 |

## 4. Purpose register (feeds every form)
| Purpose ID | Purpose (user-facing) | Service it enables | Data items | Mandatory for service? | Basis | Retention | Default |
|---|---|---|---|---|---|---|---|
<!-- REPEAT Consent-Purposes -->
| [Purpose-ID] | [Purpose-Name] | [Purpose-Service-Description] | [Purpose-Data-Items] | [Purpose-Mandatory] | Consent | [Purpose-Retention] | Off |
<!-- END REPEAT -->

> **Drafting note:** A purpose is "mandatory" only if the service cannot technically or legally be delivered without it. Marketing, personalisation, analytics, third-party sharing for those partners' own purposes, research, testimonials and the talent pool are **never** mandatory.

### 4.1 Standard consent-notice block (Rule 3), placed immediately above the controls
> **How [Client-Brand-Name] will use your data**
> We will use **[Purpose-Data-Items]** to **[Purpose-Service-Description]**. We keep it for **[Purpose-Retention]**.
> You can withdraw consent at any time at [Consent-Preferences-URL] (it's as easy as giving it), exercise your rights at [Rights-Portal-URL], or complain to the Data Protection Board of India at [DPB-Complaint-URL].
> Questions: [Privacy-Contact-Email] · Read this in: [Notice-Languages]

### 4.2 Form templates

**Form C-1: Account sign-up (web / app)**
```
[ Name ] [ Mobile ] [ Email ]  ← collected under s.7(a) for account creation
— notice block 4.1 for each optional purpose —
[ ] Send me offers and updates about [Client-Brand-Name] products by  ( ) Email ( ) SMS ( ) WhatsApp      (optional)
[ ] Personalise my recommendations based on my activity                                            (optional)
[ ] Share my contact details with [Partner-Name] so they can contact me about [Partner-Offer]      (optional)
Language: [English ▼]
Contact for privacy questions: [Privacy-Contact-Email]
          [ Create account ]       ← enabled whatever the optional choices
Terms of Use and Privacy Notice: links (acknowledgement only, separate from consent)
```

**Form C-2: Physical / paper / counter form**
Use the same table as Section 4, with a separate signature or tick box for each optional purpose, plus: "Notice version [Document-Version] shown in ________ (language)". The front-office staff member records the form ID in the consent log within [Paper-Consent-Digitisation-Period].

**Form C-3: Assisted / telephone consent (call centre)**
Script: "Before we continue, may I tell you how we will use your details? We will use [Purpose-Data-Items] to [Purpose-Service-Description] and keep it for [Purpose-Retention]. You can withdraw at any time by [withdrawal path]. Do you agree?" Only an explicit "Yes" counts. Record the call ID, the agent ID, the script version and a timestamp. Send a confirmation SMS or email containing the consent receipt (C04 §5).

**Form C-4: WhatsApp / chatbot**
An interactive button message. The notice block goes in the body; the buttons are `I agree` / `No thanks` / `Read more`. Webhook events are stored as artefacts.

**Form C-5: Re-consent on change of purpose**
"We would like to use your [data] for a new purpose: [New-Purpose]. This is optional, and your current services continue either way." Buttons: `Allow` · `Don't allow`.

<!-- IF Processes-Children-Data -->
## 5. Children's flow
Age gate → if under 18, notify the parent → verifiable parental consent (N05 Part C) → activate the child profile with restricted purposes only. Advertising, behavioural analytics and third-party sharing purposes are never shown in child flows.
<!-- END IF -->

<!-- IF Uses-Consent-Manager -->
## 6. Consent Manager route
Where the user chooses to consent through [Consent-Manager-Name], redirect to the Consent Manager with the purpose IDs and notice version. Accept the signed consent artefact it returns, and keep the Consent-Manager reference in C04. See C03.
<!-- END IF -->

## 7. Testing checklist (UAT sign-off before go-live)
- [ ] Each optional purpose has its own control, off by default
- [ ] Core service works with every optional consent declined
- [ ] Notice block shows data items, purpose, service, retention, withdrawal link, rights link, Board link and contact
- [ ] Language switch works and the chosen language is logged
- [ ] Consent artefact is created with all mandatory fields (C04 §3)
- [ ] Withdrawal takes the same number of steps or fewer, and propagates to processors / marketing tools within [Withdrawal-Effect-Period]
- [ ] No pre-consent firing of trackers or marketing pushes
- [ ] Accessibility: WCAG 2.1 AA, screen-reader labels on controls
- [ ] Dark-pattern review completed by: ________ Date: ________
