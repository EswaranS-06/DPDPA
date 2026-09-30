# DUATF: DPDP Unified Assessment & Tracking Framework

This is a web application for running DPDP Act 2023 and DPDP Rules 2025 assessments: assess, collect, review, identify gaps, track and document. It is built by ComplyX Cybersecurity Services.

It is a working compliance framework, not legal advice.

- Design plan: `docs/DUATF-GRC-Platform-Plan.md`
- Coding plan (phases C0–C13): `docs/DUATF-Coding-Plan.md`
- Live build status, computed from test results: `plan/STATUS.md`
- Design system: `docs/design/DUATF-Design-System.md`
- Decisions: `docs/adr/`

## What runs where

| Service | Port | Notes |
|---|---|---|
| Web app (Next.js) | 53000 | Framework library UI, bound to 0.0.0.0 |
| API (Fastify + tRPC) | 54000 | `/health`, `/trpc/*`, bound to 0.0.0.0 |
| PostgreSQL 16 | 55432 | Docker, `infra/docker-compose.yml` |
| Redis 7 | 56379 | Docker |
| MinIO (S3) | 59000 / 59001 | Docker; buckets `duatf-evidence`, `duatf-reports` |
| Keycloak 26 | 58080 | Docker; used from C3 |
| Mailpit | 51025 / 58025 | Docker; development mail |

## Layout

```text
apps/web          Next.js app: routes mount feature screens
apps/backend      Fastify API: health, tRPC, (later) workers and clocks
packages/core-*   platform-agnostic: config, utils, ui (design tokens, primitives)
packages/platform-*  database (Drizzle, RLS, migrations), tRPC context, object storage
packages/feature-*   framework library UI and its API
tools/            seed import, traceability, lint rules, test support
seed/             DUATF vault: one-time import input and parity fixture
infra/            docker compose, env generator, app runner
plan/             plan.yaml (tests per sub-phase), STATUS.md, manual results, reviews
```

Dependencies only point downward: `apps -> feature-* -> platform-* -> core-*`. The lint rules enforce this.

## First-time setup (on the server)

```bash
. ~/.nvm/nvm.sh                                    # Node 22 (nvm), pnpm via corepack
cd /root/Source-Code
docker compose -f infra/docker-compose.yml up -d   # services
DUATF_HOST_IP=192.168.0.110 pnpm env:make           # writes .env from infra/.env (no secrets printed)
pnpm install
pnpm db:setup && pnpm db:migrate                    # app role, schema, RLS, release guards
pnpm seed:import                                    # one-time: framework release 1.0.0
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

## How tests prove the plan

Every test that covers a planned requirement carries its ID in its name, for example `TC-C2.2-01`. `pnpm trace` reads the test report and computes a status for each test, sub-phase and phase. The statuses are PASS, FAIL, MISSING, DRIFT, DEFERRED and MANUAL-PENDING. CI fails if an active test fails, is missing, or has an ID that is not in the plan.

Expected values come from one of four sources:

| Source | Meaning |
|---|---|
| literal | Written in the plan |
| golden | A committed fixture |
| oracle | Computed at test time from the seed |
| sme | Signed off by the legal SME |
