---
type: sector_overlay
sector_code: HTA
title: Hospitality, Travel & Aviation
covers: Hotels, OTAs, travel agencies, airlines, airports, cruise, tour operators
regulators:
- Ministry of Tourism
- Bureau of Immigration/FRRO
- DGCA
- BCAS
- CBIC (Customs)
- CERT-In
key_principals:
- Guest
- Accompanying guest (child)
- Passenger
- Loyalty member
- Corporate traveller
process_templates:
- "[[HTA-01 Reservation & check-in]]"
- "[[HTA-02 Passenger booking, check-in & boarding]]"
- "[[HTA-03 Loyalty & guest preferences]]"
tags:
- dpdp/sector
- sector/hta
---

# SEC-HTA - Hospitality, Travel & Aviation

**Covers:** Hotels, OTAs, travel agencies, airlines, airports, cruise, tour operators

**Regulators:** Ministry of Tourism, Bureau of Immigration/FRRO, DGCA, BCAS, CBIC (Customs), CERT-In

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Immigration and Foreigners Act 2025 & rules | Form C reporting of foreign guests by accommodation providers (verify) |
| Local police orders | Guest ID collection at hotels |
| Customs (Passenger Name Record Information) Regulations 2022 | Airlines share PNR with Customs |
| DGCA CARs / APIS | Passenger data |
| DigiYatra policy | Face biometric, decentralised wallet (consent-based) |

## Localisation / cross-border
Airline/GDS systems global - cross-border inherent.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Guest registration records | Per police/State orders | Local orders | verify |
| PNR data (Customs) | Per 2022 Regulations | Customs PNR Regs | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- ID/passport copies stored in email/WhatsApp
- Children travelling
- Loyalty programmes
- Facial recognition (DigiYatra, hotel check-in)
- GDS/cross-border

## Where assessments get stuck here
- Front desks photocopy Aadhaar - replace with masked/offline verification
- OTA vs hotel - both DFs for booking data

See also [[Stuck-Point Playbook]].

## Typical data principals
Guest, Accompanying guest (child), Passenger, Loyalty member, Corporate traveller

## Sector process templates
- [[HTA-01 Reservation & check-in]] (Front Office)
- [[HTA-02 Passenger booking, check-in & boarding]] (Aviation)
- [[HTA-03 Loyalty & guest preferences]] (Loyalty)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
