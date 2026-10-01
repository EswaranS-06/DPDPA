# ADR-0003: Design system 2.0 (C16)

Date: 1 Oct 2026. Status: accepted by the build; awaiting ComplyX sign-off (TC-C16.7-02).

| # | Decision | Why | Consequence |
|---|---|---|---|
| 1 | **Follow the ComplyX design brief**: light-first enterprise SaaS, Inter, indigo `#4F46E5`, slate neutrals, Lucide icons | ComplyX chose the brief's look over keeping or blending the v1 "Bare Act" style | Anek Latin, Martel and the margin-note layout are gone; `docs/design/DUATF-Design-System.md` describes v2 |
| 2 | **Inter 4.1 subset from the official release**, not from Google Fonts | Google's subsets drop the OpenType features the codes need (case-sensitive forms, tabular figures) | Two self-hosted files, about 240 KB together |
| 3 | **Three themes and two densities in CSS tokens**, chosen per user in cookies | The server renders the chosen theme on first paint, without a flash | `data-theme` and `data-density` on `<html>`; TC-C16.1-01 tests contrast in every theme |
| 4 | **One status registry** for every database state | Every state needs a label, a tone and an icon, never colour alone | `apps/web/src/components/status`; TC-C16.1-02 fails when a database value has no entry |
| 5 | **Refusals inside a client's scope are explained; outside it they stay "not found"** | The brief asks for helpful permission messages; isolation must not reveal other clients | `permissionFor` in `apps/web/src/server/auth.ts` |
| 6 | **No route-level loading skeletons** | A loading boundary makes Next.js stream before `notFound()`, which turns 404 responses into 200 | The skeleton components exist in core-ui for in-page use |
| 7 | **Links to official texts point to MeitY** | The brief asks for official sources, not third-party summaries | The Act links to MeitY's PDF; the Rules link to MeitY's data protection framework page, because a direct PDF address could not be confirmed |
