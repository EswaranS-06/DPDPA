---
type: sector_overlay
sector_code: ITS
title: IT, ITeS, SaaS & BPO
covers: IT services, GCCs, SaaS product companies, BPO/KPO, cloud & data centres
regulators:
- MeitY
- CERT-In
- STPI/SEZ authorities
- Clients' regulators (indirect)
key_principals:
- Client end-customers
- Client employees
- Own employees
- Leads
process_templates:
- "[[ITS-01 Client data processing (managed services-BPO)]]"
- "[[ITS-02 SaaS multi-tenant platform]]"
- "[[ITS-03 B2B demand generation]]"
tags:
- dpdp/sector
- sector/its
---

# SEC-ITS - IT, ITeS, SaaS & BPO

**Covers:** IT services, GCCs, SaaS product companies, BPO/KPO, cloud & data centres

**Regulators:** MeitY, CERT-In, STPI/SEZ authorities, Clients' regulators (indirect)

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| DPDP s.17(1)(d) | Processing of non-India principals' data under contract with foreign person exempt (except s.8(1),(5)) |
| IT Act s.43A & SPDI Rules 2011 | Until Phase 3 |
| CERT-In Directions 2022 | 6h reporting, 180-day logs, cloud/VPN KYC |
| MeitY cloud empanelment / GI Cloud | For Government workloads |
| Client contracts (GDPR SCCs, HIPAA BAAs etc.) | Contractual privacy obligations |

## Localisation / cross-border
Processor for Indian clients' data; DF for own employees & marketing; s.17(1)(d) for foreign clients' foreign principals.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| ICT logs | Rolling 180 days in India | CERT-In | high |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Role clarity per engagement (processor vs DF)
- SaaS using customer data for product analytics/AI training = own purpose -> DF
- Offshore delivery centres serving Indian clients (cross-border)
- Sub-processor chains
- BPO agents' access to customer screens

## Where assessments get stuck here
- Clients push their DPAs - maintain clause library & obligations register per client
- India-principal data mixed with foreign-principal data in same tenant (partial s.17(1)(d))

See also [[Stuck-Point Playbook]].

## Typical data principals
Client end-customers, Client employees, Own employees, Leads

## Sector process templates
- [[ITS-01 Client data processing (managed services-BPO)]] (Delivery)
- [[ITS-02 SaaS multi-tenant platform]] (Product)
- [[ITS-03 B2B demand generation]] (Sales)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
