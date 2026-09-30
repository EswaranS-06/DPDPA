# ADR-0001: Foundation decisions (C0–C2)

Date: 30 Sep 2026. Status: accepted by the build; awaiting tech-lead review (phase C0/C1/C2 review gates).

| # | Decision | Why | Consequence |
|---|---|---|---|
| 1 | **TypeScript 6.0**, not 7.0 | typescript-eslint 8.71 supports TypeScript below 6.1; TS 7 (the native compiler) is not yet supported by the lint toolchain | Revisit when typescript-eslint supports TS 7 |
| 2 | **pnpm 12 with `allowBuilds`** | pnpm 12 refuses unapproved install scripts; only `esbuild` is approved | Supply-chain risk stays explicit in `pnpm-workspace.yaml` |
| 3 | **The framework lives in PostgreSQL as versioned releases** | Per the user's decision, Obsidian is not a working dependency. The vault is imported once as release 1.0.0 | Framework changes are new draft releases, never re-imports. Published releases are immutable (DB triggers) |
| 4 | **Obsidian wikilinks become `ref:kind/code` links at import** | Cross-references survive without Obsidian; the UI maps them to routes | Two targets stay plain text: the Process Catalogue Index and a `SYS-...` placeholder |
| 5 | **The app connects as a non-owner role (`duatf_app`)** | Postgres superusers and table owners bypass row-level security | Migrations and seeding run as the owner; the runtime never does |
| 6 | **Tenant isolation through RLS on `app.tenant_id`** | Isolation holds even if an API check is missed | Every tenant table needs a policy in a custom migration |
| 7 | **Migrations via drizzle-kit, plus hand-written SQL for security** | Generated DDL stays in sync with the typed schema; RLS, grants and triggers are explicit SQL | There are no down migrations; reproducibility is tested instead (TC-C1.2-01) |
| 8 | **The web app hosts its own tRPC endpoint and renders with server components** | Keeps the web → API types in one composition root and avoids an app-to-app dependency | `apps/backend` serves health, integrations, and later workers and clocks; both apps compose the same feature routers |
| 9 | **Feature API as a sub-feature package** (`feature-framework-library-api`) | The backend can mount the router without any UI code; the UI feature depends on its own sub-feature | This follows the monorepo rule "a parent feature may depend on its sub-features" |
| 10 | **CSS modules and design tokens**, not a utility framework | A bespoke design (Bare Act margin layout, variable-width type) is easier to hold in tokens and small modules | Tokens live in `packages/core-ui/src/tokens.css` |
| 11 | **Self-hosted fonts** (Anek Latin, Martel; OFL) | A privacy tool should not call third-party font servers, and the host runs on the LAN | Font files live in `apps/web/public/fonts` |
| 12 | **ClamAV deferred** | The user's request; the image is also unavailable because of server DNS | Uploads go through a `FileScanner` interface with a no-op scanner that records `engine: none`; ClamAV comes in C12 |
| 13 | **Ports 5XXXX, bound to 0.0.0.0** | The user's request; other stacks share the host | Web 53000, API 54000, services 51025–59001 |
| 14 | **The backend bundle includes a `createRequire` banner** | Bundled CommonJS dependencies (the MinIO client) call `require` for Node built-ins | Bundling workspace TypeScript stays simple |
