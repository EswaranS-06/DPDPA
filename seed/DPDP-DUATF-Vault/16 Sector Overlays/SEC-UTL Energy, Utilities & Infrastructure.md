---
type: sector_overlay
sector_code: UTL
title: Energy, Utilities & Infrastructure
covers: Electricity discoms, gas distribution, water utilities, EV charging, renewable retail
regulators:
- CERC/SERCs
- CEA
- PNGRB
- CERT-In
- Ministry of Power
key_principals:
- Consumer
- Applicant
- Field staff
- EV user
process_templates:
- "[[UTL-01 New connection, billing & collections]]"
- "[[UTL-02 Smart metering & analytics]]"
tags:
- dpdp/sector
- sector/utl
---

# SEC-UTL - Energy, Utilities & Infrastructure

**Covers:** Electricity discoms, gas distribution, water utilities, EV charging, renewable retail

**Regulators:** CERC/SERCs, CEA, PNGRB, CERT-In, Ministry of Power

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Electricity Act 2003 & Electricity (Rights of Consumers) Rules 2020 | New connection KYC, metering, billing |
| CEA cyber security guidelines/regulations for power sector | Security controls (verify current instrument) |
| Smart metering (RDSS) standards | Interval consumption data |
| LPG DBT (PAHAL) & subsidy schemes | Aadhaar-linked subsidies |

## Localisation / cross-border
Critical infrastructure; data typically hosted in India.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Consumer & billing records | Per SERC regulations / tax | SERC | verify |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Smart meter interval data reveals household behaviour
- Subsidy/DBT linkage
- Field staff with handheld devices
- EV charging location data

## Where assessments get stuck here
- Legacy consumer masters with no contact data - notice channel is the bill

See also [[Stuck-Point Playbook]].

## Typical data principals
Consumer, Applicant, Field staff, EV user

## Sector process templates
- [[UTL-01 New connection, billing & collections]] (Customer)
- [[UTL-02 Smart metering & analytics]] (Metering)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
