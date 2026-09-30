# DUATF design system (v1, 30 Sep 2026)

## Brief
- **Subject:** the working tool Xyberu's DPDP assessors use to read India's DPDP Act and Rules, map a client's processing, test controls and track gaps. The first screens are the Framework Library: the law broken into cross-linked obligations and controls.
- **Audience:** privacy assessors and client DPOs who cite provisions daily ("s.8(6)", "R7(2)(b)") and move between statute text, controls and evidence.
- **Primary job:** find the exact obligation, and see what it requires, when it applies, when it commences, the penalty, and which controls satisfy it. It has to be fast, precise and citation-first.

## Tokens

### Colour
| Name | Hex | Role |
|---|---|---|
| Folio | `#F4F5F2` | page ground; a cool, slightly green-grey, like government file paper |
| Sheet | `#FFFFFF` | reading surface for legal text |
| Iron-gall ink | `#1B2230` | body text; the blue-black of office fountain-pen ink |
| Pencil | `#5A6273` | secondary text, margin notes |
| Gazette rule | `#D9DDE1` | rules between rows and columns |
| Stamp violet | `#4F2E9C` | the one accent: links, current page, focus, the "today" marker. It is the violet of Indian office rubber-stamp ink |

Semantic colours are reserved for time and severity, never decoration:
- In force: `#2D7A4C`
- Starts on a date: `#9A5A00`
- ₹250 crore tier: `#A8261B`

### Type
- **Anek Latin** by Ek Type, an Indian foundry, used as a variable font (width 75–125, weight 100–800). It is the interface voice. Width does real work:
  - page titles are set wide (112%);
  - codes and citations are set condensed (86%) with tabular figures, so OBL-CON-01 and s.6(1) stay compact without a monospace face;
  - body UI text is set at normal width.
- **Martel** by Dan Reynolds, a serif that also covers Devanagari. It is the voice of the law: requirement text, statute summaries and legal quotations. It gets more line-height than the sans.
- The type scale is a 1.25 ratio from 16 px: 12.8 / 16 / 20 / 25 / 31.25 / 39. Legal text runs at a 66-character measure.
- Both families support Indian scripts, which will matter when notices in Eighth Schedule languages arrive (s.5(3)).

### Layout: the Bare Act margin
Indian Bare Acts print each section's marginal note beside the text. Every legal list and record page uses the same idea: a narrow margin column carries the citation, phase and commencement, and the text column carries the title and the requirement.

```
 ┌ margin ───────┐ ┌ text ─────────────────────────────────────┐
 s.6(1)            Valid consent standard
 R3                Consent free, specific, informed, ...  (Martel)
 Starts 13 May 27  [D06 Consent lifecycle]  [Up to ₹50 crore]
```

- Everything is left-aligned.
- The app frame is a left rail of framework sections, a top bar whose main action is search (assessors search by citation), and a content column capped at about 72 rem.

### Principles
1. **Citation first.** Every legal item leads with its citation in the margin.
2. **One loud thing.** The overview's commencement ladder (7 → 13 → 99 obligations across 2026–27, with today marked) is the memorable element. Everything else stays quiet: lists and tables, not card grids.
3. **Colour means time or severity.** Violet is for interaction only. Green and amber are for commencement, red for the ₹250 crore tier.
4. **Plain labels.** Sentence case. No all-caps labels, no dot-joined meta strings, no arrows in link text.
5. **Motion only where it explains.** The single motion on load is the "today" marker settling on the ladder, and it is disabled under reduced motion.

## Review against generic defaults
- **Palette:** it is not the cream, serif and terracotta set, and not black with acid green. Violet could read as generic "SaaS purple", so it is a deep ink violet, never used as a gradient, and sits beside blue-black ink.
- **Type:** Anek and Martel replace the usual Inter or Space Grotesk. Both come from type designers working on Indian scripts, which fits a law that requires notices in Indian languages.
- **Layout:** it replaces the SaaS card grid with the margin-note layout from the Bare Act tradition.
- **Hero:** it replaces the "big number with a small label" treatment with a dated step ladder and a plain sentence stating what is in force today.

## Accessibility floor
- Text contrast is at least 7:1 for body text and 4.5:1 for secondary text.
- Every interactive element has a visible violet focus ring.
- Pages are responsive down to 360 px; the rail becomes a horizontal section bar.
- Reduced motion is respected.
- Fonts are self-hosted (no third-party requests) with `font-display: swap`.
