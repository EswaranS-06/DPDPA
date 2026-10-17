---
id: S04
title: Algorithmic & Automated-Processing Due-Diligence Record
category: 7. Significant Data Fiduciary extras
audience: DPO, data science / AI teams, product, auditors
publish: internal (producible to the Board / auditor)
legal_basis: [DPDPA s.8(3), s.10(2)(c); Rules r.13(3)]
applies_when: Is-SDF or Uses-Automated-Decisions
flags: [Is-SDF, Uses-Automated-Decisions, Processes-Children-Data]
version: 1.0
review_cycle: before deployment; on material model change; annually for SDF
---

> **Drafting note:** Rule 13(3) requires an SDF to "observe due diligence to verify that technical measures, including algorithmic software, adopted by it for hosting, display, uploading, modification, publishing, transmission, storage, updating or sharing of personal data processed by it are not likely to pose a risk to the rights of Data Principals". Complete one record per system. For non-SDFs this is best practice, and it supports s.8(3) accuracy where automated decisions affect people.

<!-- INCLUDE doc-control -->

# Algorithmic Due-Diligence Record

## 1. System identification
| Field | Detail |
|---|---|
| System / model name & version | [Algo-System-Name] v[Algo-Version] |
| Owner | [Algo-Owner] |
| Developer / vendor | [Algo-Vendor] (in-house / third party) |
| RoPA IDs / purposes | [Algo-RoPA-IDs] |
| Function (Rule 13(3) activity) | ☐ hosting ☐ display ☐ uploading ☐ modification ☐ publishing ☐ transmission ☐ storage ☐ updating ☐ sharing |
| Type | ☐ rules engine ☐ ML classifier / scoring ☐ recommender ☐ generative AI / LLM ☐ biometric / facial recognition ☐ content moderation ☐ other |
| Decision impact | ☐ fully automated decision with significant effect ☐ human-in-the-loop ☐ decision support only |
| Data Principals affected / volume | [Algo-DP-Scope] |
| Deployment date | [Algo-Deploy-Date] |

## 2. Data
| Item | Detail |
|---|---|
| Input personal data (itemised; mark L4) | [Algo-Input-Data] |
| Training data source & legal basis | [Algo-Training-Data] (consent / s.7 / anonymised / publicly available) |
| Is personal data used to train or fine-tune? Is it disclosed in the notice? | [Algo-Training-Disclosure] |
| Children's data involved? | <!-- IF Processes-Children-Data -->Check that there is no behavioural monitoring or targeted advertising directed at children (s.9(3))<!-- END IF --> [Algo-Child-Data] |
| Outputs / inferences generated about individuals | [Algo-Outputs] |
| Retention of inputs, outputs and logs | [Algo-Retention] (logs ≥ 1 yr, Rule 6(1)(e)) |

## 3. Risk-to-rights assessment
| Risk | Assessment question | Finding | Mitigation |
|---|---|---|---|
| Accuracy (s.8(3)) | Error rates by segment? Is the data complete, accurate and consistent for decisions? | | |
| Bias / discrimination | Disparate impact across gender, age, region, language, disability, caste or religion proxies? | | |
| Transparency | Are Data Principals told that automated processing is used, and what its logic and effect are (N01 §5.4)? | | |
| Contestability | Can a person request human review or correction? | | |
| Purpose creep | Is the model used only for the specified purpose? | | |
| Data minimisation | Are all features necessary? Are proxies for sensitive attributes removed? | | |
| Security | Model-inversion / membership-inference / prompt-injection / data-leakage risks? | | |
| Rights enablement | Can access / erasure requests reach model inputs and outputs? Is a retraining policy defined? | | |
| Consent withdrawal | Can the data of a person who withdraws be excluded from future processing and training? | | |
| Children / vulnerable users | Any harm to well-being (s.9(2))? | | |
| Third-party / vendor | Vendor's use of data for its own training? (Prohibited under V01 cl.3.2 unless authorised) | | |

## 4. Testing evidence
Validation dataset & metrics: [Algo-Validation] · Fairness tests: [Algo-Fairness-Tests] · Red-team / security tests: [Algo-Security-Tests] · Explainability method: [Algo-Explainability] · Human-oversight design: [Algo-Human-Oversight].

## 5. Monitoring
Drift monitoring: [Algo-Drift-Monitoring] · Incident triggers: [Algo-Incident-Triggers] · Review frequency: [Algo-Review-Frequency] · Kill-switch / rollback owner: [Algo-Rollback-Owner].

## 6. Conclusion
☐ Not likely to pose a risk to Data Principal rights · ☐ Acceptable with conditions: [Algo-Conditions] · ☐ Not acceptable: do not deploy
Assessed by: [Algo-Assessor] · DPO review: [DPO-Name] · Date: [Algo-Assessment-Date] · Next review: [Algo-Next-Review]
