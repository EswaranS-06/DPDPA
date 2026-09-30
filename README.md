# DUATF: DPDP Unified Assessment & Tracking Framework

This is a web application for running DPDP Act 2023 and DPDP Rules 2025 assessments: assess, collect, review, identify gaps, track and document. It is built by ComplyX Cybersecurity Services.

It is a working compliance framework, not legal advice.

- Design plan: `docs/DUATF-GRC-Platform-Plan.md`
- Coding plan (phases C0–C15): `docs/DUATF-Coding-Plan.md`
- Live build status, computed from test results: `plan/STATUS.md`
- Design system: `docs/design/DUATF-Design-System.md`
- Decisions: `docs/adr/`

## What runs where

| Service | Port | Notes |
|---|---|---|
| Web app (Next.js) | 53000 | Sign-in, client tracking, knowledge base; bound to 0.0.0.0 |
| API (Fastify + tRPC) | 54000 | `/health`; tRPC answers 401 (no sessions on this port) |
| PostgreSQL 16 | 55432 | Docker, `infra/docker-compose.yml` |
| Redis 7 | 56379 | Docker |
| MinIO (S3) | 59000 / 59001 | Docker; buckets `duatf-evidence`, `duatf-reports` |
| Keycloak 26 | 58080 | Docker; realm `duatf`, sign-in with password + authenticator app |
| Mailpit | 51025 / 58025 | Docker; development mail |

## Layout

```text
apps/web          Next.js app: routes mount feature screens
apps/backend      Fastify API: health, tRPC, (later) workers and clocks
packages/core-*   platform-agnostic: config, utils, access (roles, capabilities), ui (tokens, forms)
packages/platform-*  database (Drizzle, RLS, migrations), identity (Keycloak, sessions), tRPC, storage
packages/feature-framework-library*  knowledge base page and its API
packages/feature-compliance-api      clients, assessments, evidence, findings, risks, remediation,
                                     dashboards and reports (services used by the web app)
tools/            seed import, traceability, lint rules, test support
seed/             DUATF vault (release 1.0.0 input) and question-bank/questions.yaml (release 1.1.0)
infra/            docker compose, env generator, app runner
plan/             plan.yaml (tests per sub-phase), STATUS.md, manual results, reviews
```

Dependencies only point downward: `apps -> feature-* -> platform-* -> core-*`. The lint rules enforce this.

## What the application does (V1)

| Area | Where | Notes |
|---|---|---|
| Sign-in | `/login` | Keycloak realm `duatf`: password + authenticator app; server-side sessions |
| Overall dashboard | `/` | Every visible client: latest assessment, gaps, serious risks, overdue actions, compliance by domain, risk heatmap, actions due next |
| Clients | `/clients` | Onboarding profile, departments, client users (one-time password), ComplyX team; client dashboard with figures by department |
| Departments | client > Departments > a department | Department dashboard: progress, what needs attention, findings, risks, actions, evidence |
| Assessments | client > Assessments | One item per question of the pinned release; answers, review, progress |
| Evidence | client > Evidence | SHA-256, five-minute download links, review, expiry |
| Findings and risks | client > Findings, Risks | Gap rule, L x I scoring with configurable bands, DPO risk acceptance |
| Remediation | client > Remediation | Nine-status workflow, owner cannot verify or close, re-assessment |
| Reports | `/`, client > Reports, a department | Excel workbooks at three levels (overall, client, department), each opening on a dashboard sheet; printable executive report |
| Knowledge base | `/knowledge-base` | Law, obligations, controls, question bank and reference lists on one page |
| Administration | `/admin/staff`, `/admin/risk-bands` | Firm administrators only |

Client users see only their own organisation (row-level security plus capability checks).

### Demo clients

`pnpm demo:load` loads two fictitious clients so the whole flow can be explored. Every change goes through the same services as the web app, and the events are dated over the past months:

| Client | Story |
|---|---|
| **Nadall** (`NADALL`), a multi-speciality hospital | Seven departments. Baseline assessment completed and fully reviewed four months ago (30% compliance); 16 remediation actions in every workflow state (closed, remediated, under review, rejected, overdue, accepted risk); a re-assessment under way that resolves fixed gaps and carries open ones forward (71% on the questions answered so far). |
| **AMMA** (`AMMA`), a CBSE school | Seven departments. First assessment in progress: most questions answered, some reviewed, two sent back; a critical gap on verifiable parental consent; evidence awaiting review; overdue actions. |

The demo people (a DPO, a viewer and department owners per client, and two ComplyX auditors) use `.example` addresses and have no sign-in accounts. To see the app as one of them, open the client's **People** tab as the firm administrator and press **New one-time password** next to that person; Keycloak then asks for a new password and an authenticator app. Running `pnpm demo:load` again replaces the two clients (never a real client with the same ID); `pnpm demo:load --remove` deletes them. The audit log keeps the real load time.

## First-time setup (on the server)

```bash
. ~/.nvm/nvm.sh                                    # Node 22 (nvm), pnpm via corepack
cd /root/Source-Code
docker compose -f infra/docker-compose.yml up -d   # services
DUATF_HOST_IP=192.168.0.110 pnpm env:make           # writes .env from infra/.env (no secrets printed)
pnpm install
pnpm db:setup && pnpm db:migrate                    # app role, schema, RLS, release guards
pnpm seed:import                                    # one-time: framework release 1.0.0
pnpm kb:release                                     # one-time: release 1.1.0 (question bank, SPDI sunset)
pnpm kc:setup                                       # Keycloak realm, clients, policies (idempotent)
pnpm admin:bootstrap                                # first firm admin; one-time password in .run/first-admin.txt
pnpm build && bash infra/run-app.sh start
```

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm verify` | Format check, lint, typecheck, tests (with JSON report), build, traceability gate |
| `pnpm test` | Rebuilds the test database (migrations and seed), then runs all tests |
| `pnpm trace` | Matches test results to `plan/plan.yaml` and rewrites `plan/STATUS.md` |
| `bash infra/run-app.sh restart` | Restarts the built web and API apps in the background |
| `pnpm dev:web` / `pnpm dev:api` | Development servers on 0.0.0.0 |
| `pnpm kc:setup` | Creates or updates the Keycloak realm `duatf` and its clients |
| `pnpm admin:bootstrap --email … --name …` | Creates (or resets) a firm administrator |
| `pnpm demo:load` / `pnpm demo:load --remove` | Loads (or removes) the Nadall and AMMA demo clients |

## How tests prove the plan

Every test that covers a planned requirement carries its ID in its name, for example `TC-C2.2-01`. `pnpm trace` reads the test report and computes a status for each test, sub-phase and phase. The statuses are PASS, FAIL, MISSING, DRIFT, DEFERRED and MANUAL-PENDING. CI fails if an active test fails, is missing, or has an ID that is not in the plan.

Expected values come from one of four sources:

| Source | Meaning |
|---|---|
| literal | Written in the plan |
| golden | A committed fixture |
| oracle | Computed at test time from the seed |
| sme | Signed off by the legal SME |
