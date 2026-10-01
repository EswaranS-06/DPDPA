# ADR-0005: The DUATF Playbook, guided tours of every task (C18)

Date: 1 Oct 2026. Status: accepted by the build; ComplyX's first full run is TC-C18.4-02.

ComplyX asked for a separate site on port 53001 listing every DUATF function, grouped, with a search bar; each function a button that runs headed web automation (Playwright or similar) to teach the task step by step, using the tab it opened before if there is one and a new tab otherwise.

| # | Decision | Why | Consequence |
|---|---|---|---|
| 1 | **The playbook runs on the person's own computer** at `http://localhost:53001` | A headed browser needs a screen; the build server has none, and the person must see the window | `node tools/playbook/src/bundle.ts <folder>` makes a self-contained copy with "Start playbook.cmd"; it needs Node 22.18+ and Chrome or Edge |
| 2 | **Playwright drives the installed Chrome** (`playwright-core`, channel `chrome`, Edge as fallback) with its own persistent profile | No browser download; the DUATF sign-in survives between tours | The guide window shows Chrome's "controlled by automated test software" bar |
| 3 | **Tab reuse**: the guide window's DUATF tab, else its other tab (a sign-in page), else its empty tab, else a new tab; a closed window is reopened | ComplyX's requirement | `pickTab` in `browser.ts`, tested with fakes (TC-C18.2-01) |
| 4 | **The person signs in themselves**; the guide waits on the sign-in page | Claude and the automation never type passwords; every account has an authenticator app | Tours resume by themselves once DUATF is back |
| 5 | **The guide never saves or sends anything.** Each tour ends with a hands-on step (Onboard, Save answer, Upload, Publish…) where it waits for the person, who can skip it | Tours run against real client data; teaching must not change it | Form fields may be filled with clearly marked practice values, which are lost unless the person saves |
| 6 | **Two ways to follow a tour**: "Show me" plays each step with reading time, Pause and Back; "Guide me" waits while the person does each step, with "Do it for me" | Watching first, then doing, is how people learn a tool | The card inside DUATF and the panel on the playbook page carry the same controls |
| 7 | **Tours are data** (`catalog.ts`): targets by role, label or CSS, the capability each task needs, and who may do it | One catalogue serves the site, the runner and the checks | TC-C18.1-01 compares "who can" with the permission matrix; `pnpm playbook:check` walks every tour against DUATF headless as the right kind of user (TC-C18.3-01) |
| 8 | **Only this page may drive the guide**: the server listens on 127.0.0.1, checks the Host header and accepts only JSON POSTs from its own origin | Another website must not be able to steer a signed-in browser | Cross-site requests get 403 |
