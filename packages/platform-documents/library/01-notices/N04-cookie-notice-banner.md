---
id: N04
title: Cookie Notice, Consent Banner Copy, Preference Centre & Cookie Register
category: 1. Data-principal-facing notices
audience: Website / app visitors
publish: public (banner, preference centre, /cookie-notice page); register is internal
legal_basis: [DPDPA s.4, s.5, s.6(1),(3),(4), s.7(a), s.9(3); Rules r.3; CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023]
applies_when: Uses-Cookies
flags: [Processes-Children-Data, Has-Mobile-App, Cross-Border-Transfer]
version: 1.0
review_cycle: Quarterly cookie scan; notice yearly
---

> **Drafting note:**
> - The DPDP Act has no cookie-specific provision. Cookies, SDKs, pixels and device fingerprints that process personal data (IP address, device ID, online identifiers linked to a person) fall under the Act's general consent rules.
> - **Strictly necessary** cookies (session, load-balancing, security, the consent-record cookie itself) are justified as necessary to provide the service the visitor requested. Every other category needs **prior, granular, opt-in** consent: no pre-ticked boxes, nothing fires before consent.
> - Design the banner so that "Reject all" is as prominent as "Accept all". The CCPA Dark Patterns Guidelines, 2023 list false urgency, confirm-shaming, forced action, interface interference and nagging as prohibited dark patterns.
> - Section 9(3) prohibits tracking, behavioural monitoring and targeted advertising directed at children. If the site is child-directed, or the user is known or age-gated to be under 18, suppress marketing and analytics trackers entirely.

---

## PART 1: CONSENT BANNER COPY (first layer)

**Title:** We value your privacy

**Body:**
[Client-Brand-Name] uses cookies and similar technologies. **Strictly necessary** cookies keep this site secure and working, and are always on. With your permission, we would also like to use **[Optional-Cookie-Category-List]** cookies to [Optional-Cookie-Benefit-Summary]. You can accept all, reject all, or choose by category. You can change your choice at any time from "Cookie Settings" at the bottom of every page.
Read our [Cookie-Notice-Link-Text] and Privacy Notice.

**Buttons** (equal size, colour weight and position):
`Accept all` · `Reject all` · `Choose settings`

**Language selector:** [Notice-Languages]

> **Drafting note (banner rules):**
> 1. Don't load non-essential scripts until the visitor gives consent.
> 2. Don't treat scrolling, continued browsing or closing the banner as consent.
> 3. Record each consent event in the consent log (C04): the cookie ID, the categories chosen, the banner version, a timestamp and the language.
> 4. Re-prompt after [Cookie-Consent-Validity] months, or when categories or vendors change.
> 5. Honour Global Privacy Control (GPC) signals as "Reject all" (best practice).

## PART 2: PREFERENCE CENTRE (second layer)

| Category | Toggle default | Description shown to user |
|---|---|---|
| Strictly necessary | Always on (locked) | Needed for the site to work: keeping you logged in, remembering your cart, protecting against fraud and bots, and remembering your cookie choices. |
| Functional / preferences | Off | Remember choices like language and region to give you a more personal experience. |
| Analytics / performance | Off | Help us understand how visitors use the site (pages visited, time spent, errors) so we can improve it. Where possible we use aggregated or pseudonymised data. |
| Marketing / advertising | Off | Used by us and our advertising partners to show you relevant ads on other sites and to measure campaign effectiveness. |
| Social media | Off | Let you share content and allow social platforms to recognise you. |

Each category opens a list of the vendors in it, with the cookie names, purpose, duration, and whether data goes outside India.

Buttons: `Save my choices` · `Reject all` · `Accept all`

## PART 3: COOKIE NOTICE (public page)

<!-- INCLUDE public-header -->

# Cookie Notice

### 1. What are cookies?
Cookies are small text files placed on your device when you visit a website. Similar technologies include pixels, web beacons, local storage, SDKs in mobile apps, and device identifiers. In this notice, "cookies" covers all of them.

### 2. Who is responsible?
[Client-Name], [Client-Registered-Address], is the Data Fiduciary for personal data collected through cookies on [Client-Website-URL]<!-- IF Has-Mobile-App --> and in the [Client-App-Name] app<!-- END IF -->. Some cookies are set by third parties (listed below). Those parties process the data under their own privacy notices.

### 3. Personal data collected through cookies
Online identifiers (cookie IDs, device / advertising IDs), IP address (truncated where possible), browser and device type, pages viewed, clicks and referral URLs, approximate location derived from the IP address, and session duration.

### 4. Categories, purposes and legal basis
- **Strictly necessary**: necessary to provide the service you requested; no consent required. These cannot be switched off. If you block them in your browser, parts of the site may not work.
- **Functional, analytics, marketing, social media**: **only with your consent**, by category.

### 5. Cookie list
| Cookie / SDK | Provider | Category | Purpose | Duration | Data shared outside India? |
|---|---|---|---|---|---|
<!-- REPEAT Cookies -->
| [Cookie-Name] | [Cookie-Provider] | [Cookie-Category] | [Cookie-Purpose] | [Cookie-Duration] | [Cookie-Cross-Border] |
<!-- END REPEAT -->

### 6. Children
<!-- IF Processes-Children-Data -->
We do not use analytics, marketing or social-media cookies for users we know or believe to be under 18. On our [Child-Directed-Sections], only strictly necessary cookies are used. We do not track, behaviourally monitor or target advertising at children (section 9(3) of the Act).
<!-- END IF -->
<!-- IF NOT Processes-Children-Data -->
Our website is not directed at children. We do not knowingly use cookies to track, behaviourally monitor or target advertising at children.
<!-- END IF -->

### 7. Managing and withdrawing consent
You can change or withdraw consent at any time through **Cookie Settings** in the footer. Withdrawing is as easy as giving consent. Withdrawal stops future collection. To remove cookies already stored, delete them in your browser settings. Withdrawal does not affect processing that took place before you withdrew. Mobile app users can also reset their advertising ID or limit ad tracking in device settings.

### 8. Your rights and contact
You have the rights described in our Privacy Notice ([Privacy-Notice-URL]): access, correction, erasure, nomination and grievance redressal. You also have the right to complain to the Data Protection Board of India.
Contact: [Grievance-Officer-Name], Grievance Officer, [Grievance-Officer-Email].

### 9. Updates
We review our cookies every [Cookie-Scan-Frequency]. When we add a new category or vendor, we will ask for your consent again.

---

## PART 4: COOKIE CATEGORISATION REGISTER (internal)

The column layout is in `registers/cookie-register.csv`. Required columns:

| Column | Description |
|---|---|
| Cookie / SDK name | Exact technical name or prefix |
| Domain / first- or third-party | Setting domain |
| Provider / vendor | Legal entity |
| Vendor role | Data Processor / independent Data Fiduciary |
| Category | Strictly necessary / Functional / Analytics / Marketing / Social |
| Purpose (plain language) | As shown in the cookie notice |
| Personal data collected | e.g. cookie ID, IP, device ID |
| Duration / expiry | Session / N days |
| Legal basis | Necessary for service / Consent |
| Fires before consent? | Must be "No" unless strictly necessary |
| Cross-border transfer | Country |
| Child-safe? | Must be "No" for marketing / behavioural trackers on child-directed pages |
| DPA in place? | Yes / No / N.A. |
| Last scanned | Date |
| Owner | Business owner |

**Classification decision rules**
1. If the site does not work without it **and** it is used only for the service the user asked for, it is Strictly necessary.
2. If it remembers a user choice and is not needed for core function, it is Functional.
3. If it measures usage, even when the data is aggregated, it is Analytics.
4. If it builds a profile, tracks across sites, retargets or measures ads, it is Marketing.
5. A cookie with more than one purpose takes the most privacy-intrusive category.
