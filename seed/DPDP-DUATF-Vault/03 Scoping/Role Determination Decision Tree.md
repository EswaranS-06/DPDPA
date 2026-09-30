---
type: guide
---

# Role Determination Decision Tree

```mermaid
flowchart TD
  A[Personal data involved?] -->|No| Z[Out of scope]
  A -->|Yes| B[Digital or digitised?]
  B -->|Paper only| Z2[Out of DPDP scope - other laws/security still apply]
  B -->|Yes| C[Does entity decide PURPOSE and MEANS?]
  C -->|Alone| DF[Data Fiduciary]
  C -->|Together with another| JDF[Joint Data Fiduciary - both DFs, allocate duties by agreement]
  C -->|No - acts on instructions of another| D[Uses data for ANY own purpose? e.g. analytics, AI training, marketing]
  D -->|Yes| DF2[Data Fiduciary for that purpose + processor for the rest]
  D -->|No| P[Data Processor - contract under s.8(2)]
  DF --> E[Notified as SDF?]
  E -->|Yes| SDF[Significant Data Fiduciary - add D15]
  DF --> F[Registered Consent Manager?]
  F -->|Yes| CM[Add D18]
```

## Common real-world calls

| Relationship | Usual role | Watch-out |
|---|---|---|
| Cloud IaaS/PaaS | Processor | Support access from abroad = cross-border |
| SaaS (CRM, HRMS) | Processor | Becomes DF if it uses data for its own AI/analytics |
| Payroll outsourcer | Processor | |
| BGV agency | Processor (usually) | May keep its own database -> DF |
| Payment aggregator | Processor for merchant **and** DF under RBI for KYC/AML | Mixed roles |
| Bank <-> insurer (bancassurance) | Independent DFs | Sharing needs basis + notice |
| Insurer <-> TPA | Processor (verify contract) | |
| Hospital <-> visiting consultant | Often joint/independent DF | |
| Employer <-> group insurer | Independent DFs | Employer gives notice to members |
| Group shared services entity | Processor for group cos | Each group company is its own DF |
| Marketplace <-> seller | Independent DFs for order data | Contractually limit seller use |
| Recruitment agency | Independent DF (candidate pool) + processor (client briefs) | |
| Collection agency | Processor | Conduct risk |
| Consultant/auditor | Independent DF (professional) or processor | Depends on engagement |
