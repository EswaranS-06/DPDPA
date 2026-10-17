# DPDP Compliance Template Library

Base templates for a DPDP Act, 2023 + DPDP Rules, 2025 compliance delivery, prepared by **[Server-name]** for **[Client-Name]**.

Every template is a Markdown file with YAML front matter, bracketed placeholders and comment-style conditional blocks. A later UI can read the front matter, ask the user for each placeholder and flag, and render a client-specific deliverable (DOCX/PDF/HTML).

> Status: v1.0, drafted 15 Oct 2026. The rule text was checked against the DPDP Rules, 2025 as notified by G.S.R. 846(E) dated 13 Nov 2025. Before release to any client, legal counsel should re-check each clause marked `VERIFY` in `00-common/legal-reference-matrix.md` against the Gazette copy.

---

## 1. Folder map

| # | Folder | Templates |
|---|--------|-----------|
| 00 | `00-common/` | Placeholder registry, conditional flags, legal reference matrix, shared definitions, document-control block, validation checklist |
| 01 | `01-notices/` | N01 Master Privacy Notice · N02 Purpose-specific (Customer / Patient / Attendant / Visitor) Notice · N03 Employee & Candidate Notice · N04 Cookie Notice + Banner + Cookie Register · N05 Children's Data Notice + Verifiable Parental Consent · N06 Legacy-Data Notice (s.5(2)) |
| 02 | `02-consent/` | C01 Consent Capture Forms & Flows · C02 Consent Withdrawal SOP · C03 Consent Manager Integration Note · C04 Consent Artefact / Receipt |
| 03 | `03-governance/` | G01 Data Protection Policy (Internal, Board-approved) · G02 Retention & Erasure Policy + Schedule · G03 Data Classification Policy · G04 Access Control Policy · G05 DPIA Template (+ completed example) · G06 Records of Processing Activities (RoPA) |
| 04 | `04-vendor/` | V01 Data Processing Agreement · V02 Data Sharing Agreement (Fiduciary-to-Fiduciary) · V03 Vendor Due-Diligence Questionnaire · V04 Standard DPDP Contract Clauses (Rider) · V05 Cross-Border Transfer Clauses |
| 05 | `05-rights/` | R01 Grievance Redressal Policy + Published Contact · R02 Rights Request SOP · R03 Request Intake Form / Portal Copy · R04 Rights Response Letters |
| 06 | `06-breach/` | B01 Breach Response Plan · B02 Board Intimation (Rule 7(2)) · B03 Data Principal Intimation (Rule 7(1)) · B04 Breach Register |
| 07 | `07-sdf/` | S01 SDF DPIA & Audit Report to Board · S02 DPO Appointment Letter + Published Contact · S03 Independent Data Audit Report · S04 Algorithmic / Automated Processing Due-Diligence Record |

`registers/` holds CSV column layouts for the registers (RoPA, retention schedule, cookie register, breach register, consent log, rights-request log, vendor register). The UI can turn these into spreadsheets.

---

## 2. Template grammar (for the UI parser)

### 2.1 Placeholders
- Format: `[Title-Case-Hyphenated]`, e.g. `[Client-Name]`, `[Grievance-Officer-Email]`.
- Two names are fixed by the engagement: `[Client-Name]` (the Data Fiduciary) and `[Server-name]` (our firm, the preparer). `[Server-name]` appears only in document-control blocks and cover sheets, never in the client's public-facing text.
- Regex: `\[(?:[A-Z][A-Za-z0-9]*)(?:-[A-Za-z0-9]+)*\]` (not followed by `(`). Checkboxes `[ ]` / `[x]` and drafting labels do not match.
- `00-common/placeholder-registry.yaml` is the master list. It gives each placeholder's type, description, default, validation and the templates that use it.

### 2.2 Conditional blocks
```
<!-- IF Is-SDF -->            ...content...  <!-- END IF -->
<!-- IF NOT Uses-Cookies -->  ...content...  <!-- END IF -->
<!-- IF Sector == Healthcare --> ...         <!-- END IF -->
<!-- IF Third-Schedule-Entity != None --> ... <!-- END IF -->
```
- Operators: bare flag (truthy), `NOT`, `==`, `!=`. There is no ELSE. Write a paired `IF X` / `IF NOT X` instead.
- Flags are booleans or enums defined in `00-common/conditional-flags.md` (global flags in §1, document-level flags in §1.1).
- Blocks may nest. Each `END IF` closes the nearest open `IF`. IFs may also sit inline, in the middle of a sentence.

### 2.2a Shared blocks
`<!-- INCLUDE block-name -->` inserts a block from `00-common/shared-blocks.md`: `doc-control`, `public-header`, `definitions`, `contact-block`, `board-complaint` or `languages`. Expand includes **before** you evaluate IFs and placeholders.

### 2.3 Repeating rows / blocks
```
<!-- REPEAT Processing-Purposes -->
| [Purpose-ID] | [Purpose-Name] | [Data-Items] | [Legal-Basis] | [Retention-Period] |
<!-- END REPEAT -->
```
Fields inside a REPEAT come from the named collection in the registry (`collections:` section). The repeat example above is illustrative: the real collection names are listed in the registry.

### 2.4 Drafting notes
Lines beginning `> **Drafting note:**` are guidance for the consultant. The UI must **strip them** from the final output.

### 2.5 Parse order (for the renderer)
1. Split off the YAML front matter. Never scan it for placeholders, since `flags: [Is-SDF]` would look like one.
2. Expand `INCLUDE`s.
3. Evaluate `IF` blocks.
4. Expand `REPEAT` blocks, one copy per collection item.
5. Substitute placeholders.
6. Strip drafting notes and the remaining HTML comments.
7. Fail the render if any `[Placeholder]` is still unfilled (see `validation-checklist.md`).

### 2.6 Front matter
Each template carries `id`, `title`, `category`, `audience`, `publish` (public / internal / contract / regulator), `legal_basis`, `applies_when`, `flags`, `version`, `review_cycle`.

---

## 3. Recommended UI flow
1. **Client profile.** Collect the Client-* and contact placeholders once and reuse them in every template.
2. **Applicability questionnaire.** Set the flags: SDF? children's data? Consent Manager? cross-border? sector? Third Schedule entity? This decides which templates and blocks are active (see `conditional-flags.md` §2).
3. **Data inventory.** Fill the collections: purposes, data categories, processors, cookies and retention. Fill them once in the RoPA (G06), and every other template draws from it.
4. **Render + validate.** Render the output, then run `00-common/validation-checklist.md` automatically. Every mandatory placeholder must be filled, and every statutory element listed there must be present.

---

## 4. Key regulatory dates (drive "status" text in templates)
| Date | What commences |
|------|----------------|
| 13 Nov 2025 | Act ss.1(2), 2, 18–26, 35, 38–43, 44(1),(3); Rules 1, 2, 17–21 (Data Protection Board) |
| 13 Nov 2026 | s.6(9), s.27(1)(d); Rule 4 + First Schedule (Consent Manager registration) |
| 13 May 2027 | All substantive obligations: ss.3–17, 27–34, 36, 37, 44(2); Rules 3, 5–16, 22, 23 |

Until 13 May 2027, s.43A of the IT Act, 2000 and the SPDI Rules, 2011 stay in force, because s.44(2) of the DPDP Act omits them only from that date. The templates are drafted to satisfy both regimes during the transition.

---

## 5. Tooling
- `python tools/validate.py .` checks every template's structure (balanced IF/REPEAT blocks, INCLUDEs that resolve, known flags) and writes `tools/scan.json`.
- `python tools/gen_registry.py .` rebuilds `00-common/placeholder-registry.yaml` from the templates (run it after `validate.py`). Curated descriptions and defaults for the core fields live in the `CORE` dict in that script, so edit them there, not in the YAML.

## 6. Source basis
- Digital Personal Data Protection Act, 2023 (No. 22 of 2023); commencement notification G.S.R. 843(E).
- Digital Personal Data Protection Rules, 2025, G.S.R. 846(E), 13 Nov 2025. The rule texts used for Rules 3, 6–11, 13–15 and Schedules 3 and 7 are noted in the legal matrix.
- CERT-In Directions dated 28 Apr 2022; CCPA Guidelines for Prevention and Regulation of Dark Patterns, 2023.
- Published DPDP-era company notices were reviewed for structure. Examples include a BPO's "India Addendum" (Grievance Officer block, four-rights section, 24-hour acknowledgement / 15-day resolution pattern) and telecom and bank policies (multi-channel opt-out, identity verification before rights fulfilment, a "Specified Purposes" legitimate-use list, regional-language versions). Several large Indian notices were still on the pre-DPDP SPDI model (deemed consent, no Board-complaint path), and the templates deliberately avoid those patterns.

## 7. DPDP Document Studio (web UI)

A browser app (`ui/`) that fills these templates for a client and exports the finished documents.

**Run it (recommended).** Double-click `dist/DPDP-Document-Studio.exe`. It opens the Studio in its own app window (Edge/Chrome app mode). All client projects and the export history are stored in a built-in **SQLite database** at `%APPDATA%\DPDP Document Studio\studio.db`. The exe needs no Python and no internet. Its background server stops about 45 seconds after the last Studio window closes, and opening the exe again while it is running just opens another window. If you used an earlier version, the first start imports its `projects.json`.

**Other ways.** `python tools/studio.py` is the same as the exe. You can also open `ui/index.html` directly, but then projects are saved in that browser's local storage instead of the database.

**Workflow**
- **Clients.** Dashboard of every client project in the database, with search, sector, document count, open blanks and last update. You can open, duplicate (a quick start for a similar client), export or import JSON, delete, **Back up database** (downloads a consistent copy of `studio.db`), and view the **export history** (who got which document, when, and in which format).
1. **Setup & applicability.** Enter the client and firm names, then answer the 20 applicability questions. These switch documents and sections on or off.
2. **Documents.** The app pre-selects the recommended deliverables and runs project-level checks (validation-checklist Part A).
3. **Common details.** Each value is entered once and reused across all documents.
4. **Data inventory.** Table editors for purposes, data categories, recipients, cookies, retention, sub-processors and similar lists.
5. **Build & export.** Live preview with blanks highlighted, per-document options and checks, and export to Word, HTML, Markdown, Print/PDF or a ZIP. The **Document / Clause view** switch shows any document as **one numbered clause** (e.g. 14, 14.1, 14.1.1), so it can be added to an existing contract instead of issuing N extra pages. You choose the sections, clause number and title, an opening sentence and wording replacements (e.g. `this DPA => this Clause`). Then **Copy clause** (pastes formatted into Word or Outlook), export it, or **Add to clause pack**.
6. **Clause pack.** Combines sections from several templates into one clause for an NDA, MSA, SOW or vendor contract. Presets: NDA/MSA data-protection clause (V04), breach notification only, cross-border transfer clauses (V05), controller-to-controller sharing terms (V02), full DPA as one clause (V01). You can reorder sections, renumber, copy, or export as Word/HTML/Markdown/PDF. After pasting, check cross-references such as "Clause 6.2".

**Moving data.** To move everything to another machine, copy `studio.db`, or use **Back up database**. To move a single client, use **Export** / **Import project** on the Clients page.

**After editing templates.** Rebuild the bundle the app reads:
```
python tools/validate.py .
python tools/gen_registry.py .
python tools/build_ui.py .
```
**Rebuild the exe** after changing templates or UI code (needs `pip install pyinstaller`):
```
python tools/build_exe.py
```
It rebuilds `ui/data.js`, draws the icon, and writes `dist/DPDP-Document-Studio.exe`. Share that single file with colleagues. Windows SmartScreen may warn on first run because the exe is unsigned: choose *More info → Run anyway*, or sign it with your firm's code-signing certificate.

Files: `tools/studio.py` (launcher + JSON API), `tools/studio_db.py` (SQLite schema: `clients`, `exports`, `meta`), `ui/clauses.js` (section parsing and clause renumbering), `ui/engine.js` (template grammar: INCLUDE → drafting notes → IF → REPEAT → placeholders), `ui/app.js` (UI), `ui/styles.css`, `ui/data.js` (generated).
