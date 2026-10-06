# DUATF: DPDP Unified Assessment & Tracking Framework

This is a web application for running DPDP Act 2023 and DPDP Rules 2025 assessments: assess, collect, review, identify gaps, track and document. It is built by ComplyX Cybersecurity Services.

It is a working compliance framework, not legal advice.

**This is the self-audit edition.** The auditor creates a client's departments, chooses each department's questions from the ComplyX templates, records the answers and evidence, and tracks findings, risks and remediation in one place. People at the client, such as an IT Head, can be given questions, evidence requests, actions and controls, with or without a login. See [ADR-0006](docs/adr/0006-self-audit-edition.md).

| Branch | What it holds |
|---|---|
| `main` | Long-term support: the latest complete, verified self-audit edition |
| `self-audit` | Work in progress on the self-audit edition |
| `multi-view` | The multi-user edition: Keycloak sign-in, client portal, playbook and demo clients |

- Design plan: `docs/DUATF-GRC-Platform-Plan.md`
- Coding plan: `docs/DUATF-Coding-Plan.md` (phase C19 is this edition)
- Live build status, computed from test results: `plan/STATUS.md`
- Design system: `docs/design/DUATF-Design-System.md`
- Decisions: `docs/adr/`

## Install

You need Node.js 22 or later and git. To run the services in containers, you also need Docker. Otherwise, use your own PostgreSQL 16, Redis 7 and S3-compatible storage with `--services external`.

**Linux or macOS**

```bash
curl -fsSLO https://raw.githubusercontent.com/EswaranS-06/DPDPA/main/setup.sh
bash setup.sh install --branch main --username auditor --name "ComplyX Auditor"
```

**Windows (PowerShell)**

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/EswaranS-06/DPDPA/main/setup.ps1 -OutFile setup.ps1
.\setup.ps1 install -Branch main -Username auditor -Name "ComplyX Auditor"
```

If the repository is private, clone it first (`git clone -b main https://github.com/EswaranS-06/DPDPA.git`) and run the script from the clone.

`install` does the following:

1. Clones the code into `./DPDPA`, or uses the folder it runs in.
2. Installs dependencies and writes the settings: `infra/.env` (secrets, kept) and `.env`.
3. Starts the services, then creates the databases and the app role, and runs the migrations.
4. Imports the knowledge base and publishes the release with the ComplyX question templates.
5. Creates the evidence buckets.
6. Creates the first administrator, then builds and starts the web app and the API.

The administrator's one-time password is written to `.run/first-login.txt`, which only its owner can read; it is never printed. Sign in at `http://<host>:53500/login` and choose a new password.

Run the script with no arguments to see every command. The main ones:

| Command | What it does |
|---|---|
| `update` | Pulls the latest code (fast-forward only), installs dependencies, migrates, rebuilds and restarts |
| `pull` | Pulls the latest code only |
| `repair` | Reinstalls dependencies and recreates missing settings, databases and buckets, then migrates, rebuilds and restarts. Data is kept |
| `switch --branch NAME` | Moves to another branch, then updates |
| `start`, `stop`, `restart`, `status` | Controls the built apps |
| `logs [web\|api] --lines N` | Shows the end of an app's log |
| `account --username NAME --name "Shown name"` | Creates an administrator or resets their login |
| `backup --out DIR` | Dumps the database |
| `doctor` | Checks versions, services, ports and the apps |
| `uninstall [--purge]` | Stops the apps and the services the installer started. `--purge` also deletes their data |

Options: `--dir PATH`, `--branch NAME`, `--services docker|external`, `--web-port N`, `--api-port N`, `--host-ip IP`. In PowerShell they are written `-Dir`, `-Branch`, `-Services` and so on. On the server, the same commands run as `pnpm duatf <command>` from the DUATF folder.

## What runs where

| Service | Port | Notes |
|---|---|---|
| Web app (Next.js) | 53500 | Sign-in page, client tracking, knowledge base; bound to 0.0.0.0 |
| API (Fastify + tRPC) | 54500 | `/health`; tRPC answers 401 (no sessions on this port) |
| PostgreSQL 16 | 55433 | Docker mode, `infra/docker-compose.self.yml` (project `duatf-self`), local only |
| Redis 7 | 56380 | Docker mode, local only |
| MinIO (S3) | 59010 / 59011 | Docker mode; buckets for evidence and reports |

With `--services external`, the addresses in `infra/.env` are used instead.

## What the application does

| Area | Where | Notes |
|---|---|---|
| Sign-in | `/login` | Username and password on DUATF's own page. A new login gets a one-time password that must be changed. After 5 failures the account locks for 15 minutes. Sessions are stored server-side |
| Overall dashboard | `/` | Every client: latest cycle, gaps, serious risks, overdue actions, compliance by domain, risk heatmap, what needs attention |
| Departments | client > Departments | Create a department, say what personal data it handles (DUATF suggests the elements from its name) and choose its questions from TPL-001 (Data Fiduciary), TPL-002 (Internal data handlers, ComplyX Track B) and TPL-003 (External data handlers): one by one, a section or a whole template |
| Personal data | a department > Personal data | Each data element with its category, sensitivity level (L1-L4), source, storage, security and access; the department's purposes, lawful basis, systems, recipients, transfers outside India and retention. Editable at any time |
| Data mapping | client > Data mapping | The flow of personal data from people and other sources through departments to recipients and other countries, as a diagram and in words; categories by department; the record of processing (RoPA) on screen and as an Excel workbook |
| Assessments | client > Assessments | Yes / Partial / No, maturity 0-4, choices and text. Each answer is ticked as checked; a cycle completes when every answer is checked. Questions ruled out by another answer become Not applicable automatically |
| People | client > People | People at the client, with or without a login. Give them questions, evidence requests, actions and controls; they see only their own work |
| Control owners | client > Control owners | Who owns each knowledge-base control behind the client's questions |
| Evidence | client > Evidence | SHA-256, five-minute download links, review, expiry, and every open evidence request |
| Findings and risks | client > Findings, Risks | A gap per department and question; L x I scoring with configurable bands; risk acceptance |
| Remediation | client > Remediation | Nine-status workflow; verified and closed with accepted evidence |
| Reports | `/`, client > Reports, a department | Excel workbooks (overall, client, department) and a printable executive report |
| Knowledge base | `/knowledge-base` | Law, obligations, controls, the question templates with their penalty and references, and reference lists |
| Administration | `/admin/team`, `/admin/risk-bands` | Administrators only |

Roles: Administrator, Senior auditor, Auditor, DPO, Department owner and Viewer. Only the audit team answers and checks. Only the Administrator and the Senior auditor add people and issue logins.

## The question bank

The ComplyX templates live in `seed/question-bank/source/*.xlsx`. After changing a workbook:

```bash
pnpm questions:import        # rewrites seed/question-bank/templates.yaml from the workbooks
```

`seed/question-bank/kb-mapping.yaml` maps each question to the knowledge base: domain, obligations (references, penalty, phase), controls (guidance, evidence, recommendation), scoring and gates. The release build refuses a template question without a mapping. The mapping awaits ComplyX's legal review; each `note` records where a template's citation differs from the knowledge base.

`pnpm duatf update` (and `kb`) publishes a new knowledge-base release when the question bank or the AI-drafted entries changed (`pnpm kb:questions`, `pnpm kb:content --publish`). Running assessment cycles keep their release; the next cycle gets the new questions.

## Layout

```text
apps/web          Next.js app: routes mount feature screens; the sign-in page
apps/backend      Fastify API: health, tRPC
packages/core-*   platform-agnostic: config, utils, access (roles, capabilities), ui (tokens, forms)
packages/platform-*  database (Drizzle, RLS, migrations), identity (passwords, sessions), tRPC, storage
packages/feature-framework-library*  knowledge base page and its API
packages/feature-compliance-api      clients, departments, assessments, people, evidence, findings,
                                     risks, remediation, dashboards and reports
tools/            setup (pnpm duatf), account setup, seed import, KB content, traceability, lint rules
seed/             DUATF vault (release 1.0.0 input) and the ComplyX question bank (release 1.1.0)
infra/            docker compose for the services, wrappers for older habits
plan/             plan.yaml (tests per sub-phase), STATUS.md, manual results
```

Dependencies only point downward: `apps -> feature-* -> platform-* -> core-*`. The lint rules enforce this.

## Development

| Command | What it does |
|---|---|
| `pnpm verify` | Format check, lint, typecheck, tests (with JSON report), build, traceability gate |
| `pnpm test` | Rebuilds the test database (migrations, seed, question bank), then runs all tests |
| `pnpm trace` | Matches test results to `plan/plan.yaml` and rewrites `plan/STATUS.md` |
| `pnpm dev:web` / `pnpm dev:api` | Development servers on 0.0.0.0 |
| `pnpm kb:content --publish` | Applies the knowledge-base content and publishes the next release |

## How tests prove the plan

Every test that covers a planned requirement carries its ID in its name, for example `TC-C19.6-01`. `pnpm trace` reads the test report and computes a status for each test, sub-phase and phase. The statuses are PASS, FAIL, MISSING, DRIFT, DEFERRED and MANUAL-PENDING. CI fails if an active test fails or is missing, or if a test has an ID that is not in the plan. Tests of features that exist only in the multi-view edition are marked `deferredTo: multi-view`.

Expected values come from one of four sources:

| Source | Meaning |
|---|---|
| literal | Written in the plan |
| golden | A committed fixture |
| oracle | Computed at test time from the seed |
| sme | Signed off by the legal SME |
