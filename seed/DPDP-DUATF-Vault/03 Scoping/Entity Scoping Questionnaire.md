---
type: guide
---

# Entity Scoping Questionnaire (Stage 1)

Answer once per **legal entity**. Group companies are separate Data Fiduciaries.

## A. Territorial & material scope (s.3)
1. Does the entity process personal data of individuals in India? (If yes -> s.3(a).)
2. Is any processing done outside India to offer goods/services to people in India? (s.3(b).)
3. Is any personal data collected on paper and never digitised? List it. It is out of DPDP scope, but other laws and security still apply.
4. Does the entity process data made publicly available by the individual, or under a legal obligation to publish? (s.3(c)(ii) exclusion.)
5. Is any processing for purely personal/domestic purposes (e.g. a sole proprietor's personal phonebook)?

## B. Role (s.2)
6. For each business line, who decides **why** and **how** personal data is processed? (Fiduciary vs processor.)
7. Does the entity process data **on behalf of** clients? List the clients and the services.
8. Are there arrangements where two entities jointly decide purposes (co-branding, co-lending, group shared services)?
9. Does the entity intend to register as a **Consent Manager** (Phase 2 from 13 Nov 2026)?
10. Is the entity a State instrumentality, or does it deliver State schemes (s.7(b), Rule 5)?

## C. SDF likelihood (s.10)
11. How many unique Indian data principals does it hold, and in which categories?
12. Does it process health, financial, children's or biometric data at scale?
13. Could its processing affect electoral democracy, security or public order (e.g. large social/media platform, telecom, critical infrastructure)?
14. Is it already a systemically important regulated entity (D-SIB, SSMI, large telecom)?

## D. Special populations & classes
15. Does it offer services to, or knowingly receive data of, **children (under 18)**?
16. Does it deal with persons with disabilities through lawful guardians?
17. Is it an e-commerce entity with >= 2 crore registered users in India, an online gaming intermediary with >= 50 lakh, or a social media intermediary with >= 2 crore? (Third Schedule.)
18. Is it in a Fourth Schedule Part A class (clinical establishment, healthcare professional, educational institution, creche, child transport)?

## E. Exemptions (s.17)
19. Is any processing only for legal claims, courts/regulators, crime prevention, or a court-approved scheme? (s.17(1)(a),(b),(c),(e).)
20. Does it process **non-India principals' data** under contracts with foreign persons (BPO/IT services)? (s.17(1)(d).)
21. Is it a startup or class notified under s.17(3)? Check the notifications log.
22. Does it do research, archiving or statistics without person-specific decisions? (s.17(2)(b).)

## F. Sector & other laws
23. List sector regulators (RBI, SEBI, IRDAI, DoT, NMC, etc.) and link the sector overlay notes.
24. Is it subject to data localisation under a sector law?
25. CERT-In: is the 6-hour reporting channel set up, and is the PoC designated?

## Output
Create an `entity_profile` note with these properties: `entity_role`, `sdf_status`, `third_schedule`, `children_exposure`, `pwd_exposure`, `sectors`, `exemptions_claimed`, `cross_border`, `online_presence`. These feed the engine.
