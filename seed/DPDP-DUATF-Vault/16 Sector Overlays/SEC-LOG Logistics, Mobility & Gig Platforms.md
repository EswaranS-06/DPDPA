---
type: sector_overlay
sector_code: LOG
title: Logistics, Mobility & Gig Platforms
covers: Courier/3PL, ride-hailing, food & grocery delivery, fleet operators, gig platforms
regulators:
- MoRTH
- State transport departments
- Ministry of Labour (gig workers)
- CERT-In
key_principals:
- Rider/customer
- Recipient
- Driver/delivery partner
- Merchant
process_templates:
- "[[LOG-01 Driver-delivery partner onboarding]]"
- "[[LOG-02 Trips-deliveries & live tracking]]"
- "[[LOG-03 Safety, incidents & insurance]]"
tags:
- dpdp/sector
- sector/log
---

# SEC-LOG - Logistics, Mobility & Gig Platforms

**Covers:** Courier/3PL, ride-hailing, food & grocery delivery, fleet operators, gig platforms

**Regulators:** MoRTH, State transport departments, Ministry of Labour (gig workers), CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Motor Vehicle Aggregator Guidelines 2025 (MoRTH) | Driver verification, data handling, possibly data in India (verify) |
| Code on Social Security 2020 | Aggregator obligations & gig worker registration |
| Legal Metrology/Consumer Protection | Consumer disputes |

## Localisation / cross-border
Aggregator guidelines have required data storage on Indian servers for a period (verify current).

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Trip & rider data | Per aggregator guidelines (verify) | MoRTH guidelines | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Precise location of riders, drivers, recipients
- Driver/rider background checks
- Phone-number masking
- Proof-of-delivery photos/OTP
- Safety features (SOS, recording in cab)

## Where assessments get stuck here
- Driver = both DP and worker - s.7(i)? (gig workers may not be 'employees') - usually consent/contract basis
- Recipient isn't the customer - notice gap

See also [[Stuck-Point Playbook]].

## Typical data principals
Rider/customer, Recipient, Driver/delivery partner, Merchant

## Sector process templates
- [[LOG-01 Driver-delivery partner onboarding]] (Supply)
- [[LOG-02 Trips-deliveries & live tracking]] (Operations)
- [[LOG-03 Safety, incidents & insurance]] (Safety)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
