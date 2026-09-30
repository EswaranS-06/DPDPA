---
type: guide
---

# Discovery Question Bank (Stage 2)

Use in department workshops. Every answer should become a **graph object** (process, activity, data event, purpose, system, third party, flow). The object to create is shown in brackets.

## 1. Universal lifecycle questions (ask for every process)
### Entry
1. What starts this process? Who is the person the data is about? [Data Principal type]
2. Through which channels does data arrive: form, app, phone, email, walk-in, partner, API, employer upload? [Channel]
3. Is anything captured on paper? Who types it in, where, and when? [Data Event: digitise]
4. Which fields are collected? Show me the form or screen. [Data Elements]
5. Is any field optional? Why is each mandatory field needed? [Minimisation]
6. Do you collect data about **other people**, such as family, nominees, references or contacts? [Additional Data Principals]
7. Could any of these people be under 18? How do you know their age? [flag: children]

### Purpose & basis
8. Why do you need this data? List every use, not just the main one. [Purpose x n]
9. Is it used for marketing, analytics, AI/ML, or sharing with group companies? [Secondary purposes]
10. Is there a law or regulator that requires this processing? Which one? [Basis s.7(c)/(d) or sector overlay]
11. What does the person see or hear before giving the data? Show me. [Notice]
12. How do they agree? Tick box, signature, verbal, implied? Where is that recorded? [Consent Record Type]

### Systems & people
13. Which systems store or process this data, including Excel, email, WhatsApp and shared drives? [Systems, incl. shadow]
14. Who can access it (roles, number of users)? Are there privileged/admin users? [Access]
15. Is any of it on personal phones or laptops? [Endpoint/BYOD]

### Sharing
16. Who outside your team receives it: other departments, group companies, vendors, partners, regulators, police? [Data Flow + Third Party]
17. For each recipient: do they act on your instructions or for their own purposes? [Role]
18. Is any recipient or system (incl. support staff) outside India? [flag: cross_border]
19. Is the data used to decide something about the person (approve, reject, price, hire, treat)? Is it sent to another organisation? [flag: decision_or_disclosure]

### Storage, retention, deletion
20. How long do you keep it? Is that driven by a law, a policy or just habit? [Retention Rule]
21. What happens when the purpose ends or the person leaves? Show me a deleted record. [Erasure]
22. Where are backups and archives? Are paper originals kept after scanning? [Backup/Archive]

### Rights & incidents
23. If a person asks "what do you have on me?", can you answer across all systems? [Rights capability]
24. If a person withdraws consent, what stops, and who is told? [Withdrawal propagation]
25. Have you had any data leak, misdirected email, lost device or vendor incident? [Breach history]

## 2. Department-specific add-ons
### HR
- Do you run background checks? What sources are checked (criminal, credit, social media)?
- Do you use biometric attendance or employee monitoring (DLP, screen capture, keystroke)?
- What employee data goes to insurers, payroll providers or auditors?
- Is non-core HR (wellness, surveys, social-media photos) consent-based?
- Are candidate CVs kept after rejection? For how long?

### Sales & marketing
- Where do leads come from? Do you buy lists? Do you have proof of consent from the source?
- Which pixels, SDKs and cookies run on the website/app? (Get the tag-manager export.)
- Are custom audiences uploaded to ad platforms?
- How are opt-outs propagated across email, SMS, WhatsApp and call centre tools?
- Do you run referral programmes that capture a friend's contact details?

### Customer service
- Are calls recorded? Is there a disclosure at the start? How long are recordings kept?
- Are chatbots or LLMs used? Which provider, and where is it hosted?
- Where do privacy complaints land today?

### IT
- Provide the application inventory with owners, hosting location and PD flag.
- Which systems lack access logs? Which lack encryption at rest?
- How is production data used in dev/test?
- Are there data lakes or warehouses? Which purposes feed them? Is there deletion?
- What is the backup retention? Can a single record be deleted from backups?

### Finance & procurement
- Export the vendor master. Mark which vendors receive personal data.
- Which contracts have DPAs, security clauses and breach SLAs?

### Legal & compliance
- List regulators and their reporting obligations (incl. breach clocks).
- List law-enforcement and regulator data requests in the last 12 months.
- Which record-retention laws apply? Get the legal citations.

### Admin & facilities
- CCTV: number of cameras, retention, who views footage, police sharing log, signage.
- Visitor management: what ID is captured? Is it photocopied? Is Aadhaar masked?

### Product & engineering (digital businesses)
- Show the sign-up flow. Is there an age-gate? Are there child users?
- Is there an account deletion flow? Is it actually deleted, or soft-deleted?
- Is there profiling or recommendation? Which model uses which features?
- Is there a list of third-party SDKs with their data collection?
