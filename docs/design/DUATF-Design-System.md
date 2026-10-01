# DUATF design system (v2, 1 Oct 2026)

Version 2 replaces the v1 "Bare Act" look (Anek Latin, Martel serif, stamp violet). It follows the ComplyX design brief: trustworthy, modern, technical and calm, in the manner of modern enterprise SaaS rather than a government portal or a law firm. The code lives in `packages/core-ui` (tokens and components), `apps/web/src/components` (status language, shell, dashboards) and `packages/feature-framework-library` (regulatory clock, legal reference). Phase C16 of the coding plan holds the tests.

## Brief
- **Product:** the working tool ComplyX assessors and their clients' DPOs and department owners use to assess DPDP compliance, collect evidence, rate risks and track remediation.
- **Feeling:** "Serious enough for legal and security teams, simple enough for business teams."
- **Core principle:** every compliance problem leads to an actionable next step: requirement, gap, why, recommended action, owner, deadline, evidence, review, resolution.
- **Regulatory honesty:** the DPDP Rules, 2025 commence in phases. DUATF never shows a permanent "100% compliant" verdict. The figure is a *compliance posture*, always shown with its working, the assessment it comes from and what is not yet in force.

## Tokens (`packages/core-ui/src/tokens.css`)

### Colour, light (default)
| Token | Hex | Role |
|---|---|---|
| `--color-bg` | `#F8FAFC` | page |
| `--color-surface` | `#FFFFFF` | panels, tables, inputs |
| `--color-surface-subtle` | `#F1F5F9` | table heads, the guidance column, hovers |
| `--color-border` | `#E2E8F0` | hairlines |
| `--color-border-control` | `#8391A7` | input edges: 3:1 against the surface (WCAG 1.4.11) |
| `--color-text` | `#0F172A` | body |
| `--color-text-secondary` | `#475569` | descriptions |
| `--color-text-muted` | `#5F6E84` | metadata; darker than slate-500 so it passes 4.5:1 on the subtle surface |
| `--color-primary` | `#4F46E5` | the one brand colour: primary buttons, current page, focus, chart line |

Status pairs (text, background, border, solid): success `#067647`, warning `#B54708`, danger `#B42318`, info `#175CD3`, neutral `#475569`, pending (waiting on someone else's review) `#5925DC`. Dark mode and high contrast are separate palettes in the same file, not automatic inversions. TC-C16.1-01 computes the contrast of every text pair in all three themes on every run.

Visual formula: about 70% neutral, 20% brand, 10% status. Green is not the brand: it only ever means "met" or "done".

### Type
- **Inter 4.1** (variable, weight and optical size), self-hosted and subset from the official release with every OpenType feature kept.
- Codes and citations (`FND-NADALL-004`, `s.8(6)`) use the `.code` class: tabular figures and case-sensitive punctuation, no monospace face.
- Scale: 12 metadata, 13 tables, 14 interface body, 15 reading text (requirements, guidance), 16 subsections, 18 section titles, 24 page titles, 30 tile figures, 52 for the one hero figure per view (the compliance posture). Large sizes take negative tracking.
- Sentence case everywhere. No all-caps labels, no middle-dot meta strings, no arrows in link text.

### Space, shape, depth, motion
- 4 and 8 px steps; pages pad 32 px on desktop, 24 on tablets, 16 on phones; content is capped at 1,400 px.
- Radius: 6 badges, 8 controls, 12 panels, 16 dialogs. Panels have borders, not shadows; only overlays (the user menu, the search palette, the phone drawer) cast a shadow.
- Motion is 120 to 260 ms and only answers the reader's action. The one motion nobody asked for is the regulatory clock's bars growing in on load. Everything stops under `prefers-reduced-motion`.
- Density: comfortable (52 px rows) or compact, chosen in the user menu.

## Layout
- **Sidebar (240 px):** Overview and Clients for ComplyX staff. Inside a client: a client card, then Compliance (Overview, Assessments, Evidence), Risk and remediation (Findings, Risk register, Remediation), Reporting, Organisation (Departments, People). Then Library and Administration. The user, theme, density and sign-out are at the foot.
- **Top bar:** breadcrumbs, and the search button (Ctrl K or /).
- **Tablet (641 to 1,024 px):** the sidebar becomes a 64 px icon rail; names stay available to screen readers and as tooltips.
- **Phone (640 px and less):** a menu button opens the sidebar as a drawer; tables become cards with each column's name beside its value.

## The status language (`apps/web/src/components/status`)
Every state is a badge with a label, a tone and a Lucide icon, never colour alone. TC-C16.1-02 checks that every database value has an entry.

| Tone | Means | Examples |
|---|---|---|
| success | met or done | Yes, Compliant, Accepted, Closed, Remediated |
| warning | needs attention | Partial, Potential gap, Pending evidence, Open risk |
| danger | a gap or a refusal | No, Gap, Sent back, Rejected, Overdue |
| info | work under way | In progress, Assigned |
| pending | waiting on someone else's review | Awaiting review, Under review, In review |
| neutral | not started or not applicable | Not assessed, Not applicable, Draft, Closed finding |

## Patterns
- **Needs your attention:** each user's actionable work, most urgent first, each row a sentence, its context and one button that says what happens ("Fix answers", "Review evidence", "Verify actions"). It only offers work the person's role can do; department owners see their own department. TC-C16.3-01.
- **Compliance posture:** one hero figure, the outcome bar with counts, posture by assessment, and "How this figure is calculated", which shows the working with the assessment's own numbers and what is left out. TC-C16.3-02.
- **Regulatory clock:** obligations in force today and when the rest start, one row per commencement date, with links to MeitY's official texts.
- **Requirement (question) page:** the work on the left (answer, evidence, review, department, evidence trail) and the guidance on the right (what this checks, evidence to provide, what to do if No or Partial). The legal reference is one click away and lists each obligation with its Act or Rule citation, whether it is in force or starts in so many days, and its penalty tier. TC-C16.4-01.
- **Remediation path:** on a finding, six steps from "Gap found" to "Closed", with the next step marked.
- **Search everywhere:** a palette over everything the user can open; the same results at `/search`. TC-C16.5-01.
- **States:** empty states say what is missing, why it matters and what to do. Errors say what happened and give an error ID. Refusals name the action, the reader's role and who can do it (TC-C16.6-01). Other clients' records still answer "not found".

## Charts
There are five kinds, each answering one question: the outcome bar (how the questions were answered), meters (requirement areas), the posture trend (how it moved across cycles), the risk matrix (likelihood by impact) and the regulatory clock. Outcome colours are status colours, checked with the palette validator. Amber has low contrast on white, so every chart also shows its counts as text, and a table holds the same figures.

## Accessibility (WCAG 2.2 AA target)
- Contrast is tested for every theme (TC-C16.1-01). Input edges and the focus ring have 3:1.
- The focus ring is visible on everything. Pages have a skip link, landmarks and breadcrumbs, and the palette uses the combobox and listbox pattern.
- Touch targets are at least 44 px on coarse pointers. Reduced motion and forced colours are respected.
- A high-contrast theme is available in the user menu.

## Review against generic defaults
- The brief pins the visual direction (Inter, indigo, slate, Lucide), and the build follows it. Where the brief left freedom, the SaaS-card kit was avoided. Cards hold only figures, panels and work lists. Radii differ by role. Shadows appear only on overlays, and there are no gradient washes.
- Version 1's one loud thing, the commencement ladder, is kept as the regulatory clock, because it is what is specific to this subject: a law whose obligations start in phases.
