# ADR-0002: Identity, roles and client isolation

Date: 2026-09-30. Status: accepted.

## Context

DUATF is used by Xyberu staff and by the staff of each client. A client must never see another
client's records, and a department owner should only answer for their own department.

## Decisions

1. **Keycloak holds credentials; DUATF holds roles.** Realm `duatf` (set up by `pnpm kc:setup`)
   has registration off, a 12-character password policy with all character classes, brute-force
   lockout and TOTP. Every new user must choose a password and enrol an authenticator app at
   first sign-in (`UPDATE_PASSWORD`, `CONFIGURE_TOTP`). DUATF never sees passwords.
2. **Sign-in is the OpenID Connect code flow with PKCE (S256), state and nonce.** The state is
   checked before any call to Keycloak. A Keycloak identity is linked to a DUATF user by its
   subject, or on first sign-in by the invited email address; anyone else is refused.
3. **Sessions are server-side.** The browser gets a random 256-bit token in an HttpOnly,
   SameSite=Lax cookie; the database keeps only its SHA-256. Sessions expire after
   `SESSION_TTL_HOURS` and are revoked on sign-out. Sign-out is POST only.
4. **Roles.** Firm: `firm_admin`, `lead_auditor`, `auditor`. Client: `client_dpo`,
   `department_owner`, `client_viewer`. A role is granted firm-wide, for one client, or for one
   department of a client. The capability matrix lives in `packages/core-access` and is pinned by
   a golden test (TC-C3.3-01).
5. **Two layers of client isolation.** Application code checks capabilities for the client (and
   department) in scope; PostgreSQL row-level security independently limits every transaction to
   the tenants the user may see (`tenant_visible()`: one tenant, a list, or all for firm-wide
   staff). The app connects as the non-owner role `duatf_app`, so RLS always applies.
6. **Audit log.** Every change appends a hash-chained event (SHA-256 over the previous hash and
   the canonical event). The app role cannot update or delete audit rows; `verifyAuditChain`
   names the first tampered row.
7. **Records outside a user's scope answer "not found"**, so their existence is not revealed.

## Consequences

- Client users are created by DUATF staff (or the client DPO) through the Keycloak admin API
  using the `duatf-admin` service account, which can only manage users.
- The API on port 54000 has no sessions; its data procedures answer 401. Signed-in users go
  through the web app.
