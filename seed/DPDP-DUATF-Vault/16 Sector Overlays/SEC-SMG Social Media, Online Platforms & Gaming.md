---
type: sector_overlay
sector_code: SMG
title: Social Media, Online Platforms & Gaming
covers: Social networks, messaging, dating, content/creator platforms, online gaming, marketplaces for services
regulators:
- MeitY
- CERT-In
- Online gaming authority (under 2025 Act, as notified)
key_principals:
- User
- Minor user & parent
- Non-user in contacts/UGC
- Creator
- Advertiser contact
process_templates:
- "[[SMG-01 Account creation & age assurance]]"
- "[[SMG-02 Feed, recommendations & ads]]"
- "[[SMG-03 Content moderation & LEA requests]]"
- "[[SMG-04 Game accounts, wallets & fair play]]"
tags:
- dpdp/sector
- sector/smg
---

# SEC-SMG - Social Media, Online Platforms & Gaming

**Covers:** Social networks, messaging, dating, content/creator platforms, online gaming, marketplaces for services

**Regulators:** MeitY, CERT-In, Online gaming authority (under 2025 Act, as notified)

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| IT Act 2000 & IT (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021 | Due diligence; retain user info 180 days after deletion; SSMI (>= 50 lakh users) obligations incl. grievance, compliance officer |
| Promotion and Regulation of Online Gaming Act 2025 | Prohibits online money games; regulates e-sports/social games (verify rules) |
| DPDP Third Schedule | Social media >= 2 crore / online gaming >= 50 lakh users: 3-year inactivity erasure |
| DPDP s.10 | Strong SDF candidates |

## Localisation / cross-border
Global platforms: cross-border default; watch s.16 negative list and SDF localisation (R13(4)).

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| User info after account deletion | 180 days | IT Rules 2021 r.3(1)(h) | high |
| Inactive user data | 3 years then erase (48h notice) | DPDP Third Schedule | high |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Children & age assurance at scale
- Behavioural advertising & recommender algorithms (R13(3))
- UGC containing third-party PD
- Law-enforcement data requests & traceability
- Deceased users' accounts (nomination)

## Where assessments get stuck here
- IT Rules 180-day retention vs DPDP erasure on withdrawal - document legal retention
- Friend/contact uploads = PD of non-users

See also [[Stuck-Point Playbook]].

## Typical data principals
User, Minor user & parent, Non-user in contacts/UGC, Creator, Advertiser contact

## Sector process templates
- [[SMG-01 Account creation & age assurance]] (Platform)
- [[SMG-02 Feed, recommendations & ads]] (Platform)
- [[SMG-03 Content moderation & LEA requests]] (Trust & Safety)
- [[SMG-04 Game accounts, wallets & fair play]] (Gaming)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
