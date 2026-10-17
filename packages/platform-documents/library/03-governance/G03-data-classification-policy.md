---
id: G03
title: Data Classification Policy (Personal-data aware)
category: 3. Internal governance policies
audience: All personnel, IT, Information Security
publish: internal
legal_basis: [DPDPA s.8(4), s.8(5), s.9, s.10(1); Rules r.6(1)(a); SPDI Rules r.3 (until 13 May 2027)]
applies_when: always
flags: [Sector, Processes-Children-Data, Uses-Biometrics]
version: 1.0
review_cycle: annually
---

<!-- INCLUDE doc-control -->

# Data Classification Policy

## 1. Purpose
To classify the Company's information by sensitivity, so that security safeguards (Rule 6) are proportionate to the risk of harm to Data Principals and to [Client-Name].

> **Drafting note:** The DPDP Act does not define "sensitive personal data". Every category of personal data receives the same legal protection, and risk is reflected in the safeguards and in SDF notification criteria (s.10(1): volume and sensitivity of data, risk to rights). Until 13 May 2027, the SPDI Rules 2011 still define SPDI (passwords, financial information, health conditions, sexual orientation, medical records, biometric information). The "Restricted-PD" level below covers both.

## 2. Classification levels
| Level | Label | Definition | Examples |
|---|---|---|---|
| L4 | **Restricted: Personal Data (High-risk)** | Personal data whose compromise is likely to cause significant harm (financial loss, discrimination, physical harm, identity theft, reputational damage), or that relates to vulnerable persons | Health and medical records; biometrics; financial account / card data; government IDs (Aadhaar, PAN, passport); passwords / credentials; children's data; precise location; sexual orientation, religion or caste data where collected; genetic data; data of persons with disability; investigation / POSH records |
| L3 | **Confidential: Personal Data** | Any other personal data | Name + contact; customer ID; purchase history; employee records (non-L4); device identifiers; IP addresses; CCTV; call recordings |
| L2 | **Internal** | Non-personal business information for internal use | Policies, internal memos, non-personal analytics |
| L1 | **Public** | Approved for public release | Published notices, marketing material, annual reports |

Aggregations escalate the level. Large volumes of L3 data (more than [Bulk-Threshold-Records] records) or combined data sets that allow profiling are treated as **L4**.

## 3. Handling requirements
| Control | L4 Restricted-PD | L3 Confidential-PD | L2 Internal | L1 Public |
|---|---|---|---|---|
| Encryption at rest | Mandatory (AES-256 or equivalent); field-level encryption or tokenisation for IDs, financial data and health data | Mandatory | Recommended | — |
| Encryption in transit | TLS 1.2+ mandatory | TLS 1.2+ mandatory | TLS | — |
| Masking in non-production / UI | Mandatory (masked or synthetic test data only) | Mandatory in non-production | — | — |
| Access | Named individuals, need-to-know, MFA, quarterly review | Role-based, MFA for remote access, half-yearly review | Employees | Anyone |
| Logging | Every read/write logged; kept ≥ 1 year | Access logged; kept ≥ 1 year | Standard | — |
| Sharing externally | DPO approval + DPA/DSA + encryption | DPA/DSA | NDA | Free |
| Removable media / personal email | Prohibited | Prohibited | Prohibited without approval | Allowed |
| Printing | Restricted, secure print | Minimise | Allowed | Allowed |
| Cross-border | Steering Committee approval (V05) | DPO approval (V05) | — | — |
| Disposal | Certified erasure (G02 §8) | Certified erasure | Standard deletion | — |
| DPIA required for new processing | Yes | If large scale or novel | No | No |

## 4. Labelling
Documents carry a header or footer label. Systems carry a classification in the CMDB / data catalogue. Database columns holding L4 data are tagged in the data catalogue so that DLP and masking rules apply automatically.

## 5. Responsibilities
Data owners classify; IT enforces controls; users handle data according to its label; the DPO and CISO resolve disputes.

## 6. Data discovery
Data-discovery scans for personal data in structured and unstructured stores are run every [Discovery-Scan-Frequency], and the results are reconciled with the RoPA (G06).
