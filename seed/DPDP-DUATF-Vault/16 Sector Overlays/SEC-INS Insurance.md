---
type: sector_overlay
sector_code: INS
title: Insurance
covers: Life, general & health insurers, TPAs, brokers, web aggregators, corporate agents, POSPs
regulators:
- IRDAI
- CERT-In
- Insurance Ombudsman
- FIU-IND
key_principals:
- Proposer
- Life assured
- Nominee
- Beneficiary
- Claimant
- Dependant (child)
- Agent/POSP
- Hospital staff
process_templates:
- "[[INS-01 Lead generation & quote (web aggregator, agents, bancassurance)]]"
- "[[INS-02 Proposal, medicals & underwriting]]"
- "[[INS-03 Issuance, renewals & endorsements]]"
- "[[INS-04 Claims intimation, TPA & settlement]]"
- "[[INS-05 Group-employee benefit policies]]"
tags:
- dpdp/sector
- sector/ins
---

# SEC-INS - Insurance

**Covers:** Life, general & health insurers, TPAs, brokers, web aggregators, corporate agents, POSPs

**Regulators:** IRDAI, CERT-In, Insurance Ombudsman, FIU-IND

## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)
| Law / instrument | Why it matters for personal data |
|---|---|
| Insurance Act 1938 | Licensing |
| IRDAI (Maintenance of Insurance Records) Regulations 2015 | Records incl. electronic maintained in data centres located in India (verify current) |
| IRDAI Information & Cyber Security Guidelines 2023 | Security controls, incident reporting, audits |
| IRDAI (Protection of Policyholders' Interests...) Regulations 2024 & Master Circular | Disclosure, claims, grievance, confidentiality |
| IRDAI TPA / health services regulations | Health claims data handling |
| PMLA 2002 (life insurers) | KYC & records |

## Localisation / cross-border
Policyholder records to be maintained in India (IRDAI records regulations). Health data flows to TPAs/hospitals.

## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')
| Record | Period | Source | Confidence |
|---|---|---|---|
| Policy & claim records | Policy term + period prescribed (often 10 yrs after claim settlement/expiry in many insurers' policies) | IRDAI records regs | verify |
| KYC records (life) | 5 years after relationship | PMLA | high |

> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.

## DPDP hotspots in this sector
- Health data in underwriting & claims (proposal forms, medical reports)
- Agents/POSPs/brokers - who is DF?
- Web aggregators & lead sharing
- Group policies: employer supplies employee/dependant data
- Children dependants

## Where assessments get stuck here
- Group health data received from employers without notice to members - use employer as notice channel
- Old policy files (paper) digitised in bulk
- Reinsurers abroad - cross-border & s.16(2)

See also [[Stuck-Point Playbook]].

## Typical data principals
Proposer, Life assured, Nominee, Beneficiary, Claimant, Dependant (child), Agent/POSP, Hospital staff

## Sector process templates
- [[INS-01 Lead generation & quote (web aggregator, agents, bancassurance)]] (Distribution)
- [[INS-02 Proposal, medicals & underwriting]] (Underwriting)
- [[INS-03 Issuance, renewals & endorsements]] (Policy Servicing)
- [[INS-04 Claims intimation, TPA & settlement]] (Claims)
- [[INS-05 Group-employee benefit policies]] (Group Business)

## Plus common functions
All [[Process Catalogue Index|common-function templates]] (HR, finance, marketing, IT, admin, legal) also apply.
