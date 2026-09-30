---
type: sector_overlay
sector_code: MFG
title: Manufacturing, Industrial & Automotive
covers: Factories, industrial goods, consumer durables, automotive OEMs & dealers, connected products
regulators:
- Ministry of Labour (Labour Codes)
- State factory inspectorates
- MoRTH (vehicles)
- CERT-In
key_principals:
- Worker (permanent/contract)
- Dealer/distributor staff
- End customer
- Vehicle owner/driver
- Visitor
process_templates:
- "[[MFG-01 Shop-floor workforce management]]"
- "[[MFG-02 Occupational health & safety]]"
- "[[MFG-03 Dealer network, warranty & service]]"
- "[[MFG-04 Telematics & IoT data]]"
tags:
- dpdp/sector
- sector/mfg
---

# SEC-MFG - Manufacturing, Industrial & Automotive

**Covers:** Factories, industrial goods, consumer durables, automotive OEMs & dealers, connected products

**Regulators:** Ministry of Labour (Labour Codes), State factory inspectorates, MoRTH (vehicles), CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Four Labour Codes (Wages, IR, Social Security, OSH) - in force from 21 Nov 2025 (verify) | Worker registers, medical examinations, contract labour |
| Factories Act 1948 (as subsumed) | Health registers for hazardous processes |
| Motor Vehicles Act / AIS standards | Vehicle telematics, VLTD for commercial vehicles |
| Consumer Protection Act 2019 | Warranty & product liability records |

## Localisation / cross-border
Connected products & telematics often cloud-hosted abroad by global OEM.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Worker & wage registers | Per Labour Codes & rules | Labour Codes | verify |
| Statutory medical examination records (hazardous) | Long retention (often decades) per OSH rules | OSH Code rules | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Large contract/temporary workforce - biometric attendance
- Occupational health records
- Dealer & distributor networks holding customer data
- Connected vehicles/devices (location, driving behaviour)
- Warranty registration & service history

## Where assessments get stuck here
- Dealers are independent businesses - DF-to-DF sharing vs processor
- Shop-floor paper registers

See also [[Stuck-Point Playbook]].

## Typical data principals
Worker (permanent/contract), Dealer/distributor staff, End customer, Vehicle owner/driver, Visitor

## Sector process templates
- [[MFG-01 Shop-floor workforce management]] (Plant HR)
- [[MFG-02 Occupational health & safety]] (EHS)
- [[MFG-03 Dealer network, warranty & service]] (Sales & Service)
- [[MFG-04 Telematics & IoT data]] (Connected Products)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
