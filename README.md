# ARB Gaming — Dispute Resolution Console

A white-label dispute resolution console, built for **ARB Gaming** — the US
social+ gaming operator behind Modo Casino and the Publishers Clearing House
free-to-play games. A second tenant (**PCH Games**) ships in the same codebase
and generates a complete dataset, not just recolored chrome.

Vite + React 18 + React Router 6. **No UI kit, no charting library** — every
icon and every chart is hand-rolled inline SVG.

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build to dist/
npm run preview      # serve the built output
```

**Demo credentials: `ARBGamingDemo` / `Changeme123`** — also shown on the sign-in
screen. (The PCH tenant uses `PCHGamesDemo` / `Changeme123`.)

---

## Why the data looks the way it does

ARB sells **digital goods that are credited instantly**. That single fact drives
most of what is different here from a generic chargeback tool:

- **There is no shipment.** A "services not received" dispute is not about a
  parcel, it is about whether Gold Coins reached the player's balance. So the
  case carries a **credit method**, a **credit reference** and a **coin credit
  state** (`Credited in full` / `Partially credited` / `Not credited` /
  `Credited then reversed` / `Credit pending review`) where a retail tenant would
  carry carrier, tracking and condition.
- **The counterparty is a game studio, not a merchant.** A cluster of open
  disputes against one studio inside a month is usually a broken title, not
  three unlucky players — which is exactly what the consolidation rule is tuned
  to surface.
- **US-only, state-level.** USD, `en-US`, `America/New_York`, and the `markets`
  axis holds **state codes**, not country codes. The spread (FL TX CA NY GA NC OH
  PA IL AZ CO NJ) deliberately omits WA, ID, MI and NV, where promotional
  sweepstakes play is not offered.
- **Prices sit on the real ladder.** Coin packages sell at `.99` price points,
  so every generated purchase value snaps onto that ladder. Nobody has ever
  bought a $9.84 package.
- **MCC 7995 shapes the reason-code mix.** Card-absent fraud and "services not
  provided" dominate; there is no card-present family in the book at all.

---

## The four decisions worth knowing about

### 1. The hybrid data model

Two intake paths land in **one operational queue**, keyed on `caseType`:

| | `chargeback` | `claim` |
|---|---|---|
| Source | Card network | Player Protection |
| Carries | ARN, masked PAN, acquirer case #, BIN, MID, MCC, scheme, reason code (13.1, 13.2, 13.3, 10.4, 11.2, 12.5, 4837, 4853, 4855, C08, F24…), cycle (1st CB / 2nd CB / Pre-Arb / Retrieval / RFI), cardholder, card type | Game, category, player, game studio, purchase ID, claim reason, payment method |

Exactly **2:1 chargebacks to claims** across 1,200 cases (800 / 400).

Chargebacks **also carry the platform context** — game, purchase value, purchase,
player, studio, studio rating, credit state. An analyst defending a 13.1 on a
coin purchase is really arguing about whether the balance was credited and
played, so that evidence sits on the case beside the ARN.

The cost of one shared queue is a table that would otherwise be half N/A.
`src/domain/caseTypes.js` solves that: **columns adapt to the case-type filter**.
On the mixed view a single Reference column renders whichever identifier the row
actually has; filter to one path and that path's real columns appear.

### 2. Consolidation, and what actually counts as a double refund

Three linking rules, configured in `brand.config.js`:

| Rule | Minimum | Window | Filter |
|---|---|---|---|
| Same card | 2 | 90 days | — |
| Same purchase | 2 | 120 days | — |
| Same game studio | **3** | **30 days** | **Open only** |

**The thresholds are the feature.** Two disputes on one card is a signal; two
against one studio is just a studio with volume. Measured on the shipped book:
**13.2%** flagged (158 of 1,200 cases, 64 groups) — inside the 10–15% band where
the flag still carries information.

**Only a shared PURCHASE can be refunded twice.** 13 groups span both channels,
but only **5** carry the danger treatment and the double-refund wording — the
ones sharing a purchase. A studio group containing a chargeback and a claim
across two different purchases is two separate losses, and the panel says so
rather than crying wolf.

### 3. Special instructions gate behavior

A blocking instruction disables the matching action tile and explains why on
hover: a regulatory hold disables Write Off, pre-arbitration disables Split Case,
a claim disables Representment because there is no card leg. The instruction card
and the tiles read from one source in `data/work-case.js`, so they cannot
disagree.

### 4. Responsible gaming is a routing decision, not a note

`Charged after self-exclusion` is a claim reason like any other in the data, but
it is a **compliance** matter before it is a payments one. It routes to its own
queue (Responsible Gaming Review), raises a **Restricted Account** case flag, and
has a dedicated rule in the Case Creation group. The flag's *label* comes from
the tenant's own claim-reason list, so the PCH tenant reads it as "Charged after
account closure" without a component change.

---

## Brand assets

`public/arb-wordmark.svg` is the client's own **arb interactive** lockup. Nothing
in the artwork is touched — the only change is the viewBox. The export canvas is
331×80 while the artwork occupies x 34.8–290.1, y 17.0–51.2, and that off-center
padding makes the rail lockup float off its own left edge; it is trimmed to the
artwork's bounds plus 4 units. `brand.config.js` carries the resulting 263.3:42.2
ratio. `arb-wordmark-dark.svg` is the same paths recolored for light surfaces.

`public/tenant-arb.svg` is the app icon — favicon, and the letterhead mark on
generated dispute documents. It matches ARB's own webclip rather than being
invented: the three "arb" glyphs lifted unchanged out of the lockup, white on a
flat `#5C1BF9` rounded square at ~58% of the tile width.

> The glyphs are selected by **measured bounding box, not file order**. The
> export appends the re-outlined `a` and `b` after every other path, so they are
> elements 18 and 19 while the `r` is element 0 — taking the first three elements
> gets you the `r` plus two letters of "interactive".

Wordmark rendering only ever uses the image on **dark** surfaces (`inverse`) —
the nav rail and the sign-in panel — which is the only place white-on-transparent
artwork is correct. `.wordmark__image` shrinks to the space it is given rather
than pushing the rail's collapse button off the edge, since tenant lockups differ
wildly in aspect ratio (this one is 6.2:1).

### Palette provenance

`primary` and `navActive` are **sampled from ARB's own published assets**, not
invented:

| Token | Value | Source |
|---|---|---|
| `primary` | `#5C1BF9` | flat violet of ARB's app webclip |
| `primaryDeep` | `#3A11B0` | deep purple, arbinteractive.com |
| `navActive` | `#8A5EFF` | violet accent, arbinteractive.com |
| `navRail` | `#231839` | page surface, arbinteractive.com |
| `chartDuo[1]` | `#169898` | CTA cyan `#28E0E0`, darkened for a white card |

The app tile carries the same `#5C1BF9` as `primary`, so the favicon and the
letterhead can never disagree with the UI around them. `#5C1BF9` measures
**7.05:1** against white, so white button and pill labels pass AA. `#8A5EFF`
measures **4.06:1** on the rail — which is fine, because there it is an icon and
a 2px inset bar, and WCAG's bar for a graphical object is 3:1. The label beside
it is white on the rail itself at 12.6:1.

That distinction is enforced: `tests/palette.test.js` asserts 3:1 for the nav
accent and **4.5:1 for any fill that carries white text**. It caught the rule
builder putting white text on `navActive` at 4.10:1 on a light surface — that
fill is now `primary`.

The chart ramp is re-derived from the sampled primary and steps evenly in
lightness — L\* 37.7 / 52.5 / 69.7 / 86.9.

---

## White-label architecture

`src/brand/brand.config.js` is the single control file: palette, wordmark, logo
path, currency, locale, timezone, vocabulary, reason codes, entities, queues,
due-date offsets, thresholds, preference options and feature flags.
`BrandProvider` writes the palette to CSS custom properties at runtime.

> **No component hard-codes a color, a brand name, or a tenant value.** Colors
> reach the DOM as `var(--c-*)`, nouns through `brand.terms`, and the logo as a
> **path** — never an import.

```bash
VITE_TENANT=pch npm run dev
```

Tenant leaks found and converted — every one is the same class of bug, a
plausible default that only misbehaves under a second tenant:

| Source | Leak |
|---|---|
| `utils/format.js` | `'en-US'` **and** `currency = 'USD'` hard-coded in the formatter |
| `data/cases.js` | Entity-weight map keyed on literal entity ids; a hard-coded `ORD-` purchase prefix |
| `data/permissions.js` | Permission list built from a *different* navigation — granting Case Priority, Archived Cases, Unmatched Docs, Criteria Check and Scheduler |
| `data/people.js` | External email domains and a hard-coded "Chargeback Analyst" role name |
| `data/alerts.js` | Statement descriptors keyed on literal entity ids |
| `pages/SystemPreferences.jsx` | A European currency/locale/**timezone** option list baked into the page — a US tenant could not find its own timezone in its own dropdown |
| `domain/caseTypes.js` | `Carrier`, `Condition`, `Plan Price`, `Market` and a literal `BP` case-type chip |
| `components/workcase/DocViewer.jsx` | Shipment prose — delivery to a street address, and a postage line — on a digital-goods merchant |
| `styles/tokens.css` | Fallback palette from the previous tenant |

### Chart palette

**Ordered data gets one hue plus tints.** Five steps of the brand violet from the
deep rail color to a pale tint. Separation comes from **lightness rather than
hue**, so the ramp survives color-vision deficiency and greyscale printing.
Assigned in fixed order, never cycled; a sixth category folds into "Other".

**A two-way split gets a hue pair instead**, because lightness separation fails
there. The ramp's own first two steps measure **CIEDE2000 15 apart under normal
vision and 15 again under every simulated color-vision deficiency** — not a
distinction a reader can use. So `chartDuo` pairs the brand violet with ARB's
CTA cyan:

| | Value | Note |
|---|---|---|
| `chartDuo[0]` | `#5C1BF9` | brand violet |
| `chartDuo[1]` | `#169898` | ARB's `#28E0E0` cyan, darkened — the published value is 1.64:1 on white, right on their dark site and invisible on a white card |

Measured against the violet: **42 normal / 37 protanopia / 29 deuteranopia**.
Tritanopia is the weak axis at 17, because violet and cyan both collapse toward
blue there — so `LineChart` **dashes** every series past the first and the legend
key carries the dash too. Color is never the only cue.

Semantic green and red stay for UI state (an overdue pill, a failed row) and are
never used as a chart series.

---

## Navigation

The edited IA. **The omissions are deliberate** and documented in
`src/data/navigation.js`:

```
Dashboard
Alerts     > Alert case work | Alert settings | Alert permissions |
             Alert reporting | Alert assignments | Alert validations
             ↑ network EARLY WARNING (Verifi CDRN / Visa RDR / Ethoca) —
               refund before a chargeback is filed. Not a notifications inbox.
Rules      > Rule groups | Bulk actions | Rule check     ← not "Criteria check"
Case admin > Assignment reasons | Queue management |
             Case management | Upload cases             ← no Case priority;
                                                          Archived is a TAB
Work case
Reports    > Reports center | Monitoring | Custom reports ← no Scheduler page
Users                                                    ← ONE page, tabs
API documentation
Settings   > Account settings | Webhooks | System preferences
Help
```

Priority is derived from due date and value, so there is nothing to administer.
**The Permissions grid is generated from this navigation**, so it can never grant
access to a page that does not exist.

---

## Global patterns

- **Tooltips on everything truncated or icon-only**, rendered in a portal at the
  document root with a high z-index, ~400ms delay, dismissed on scroll.
  Everything that floats goes through `components/ui/Overlay.jsx`, so nothing is
  clipped by a table's overflow container.
- **One data table** for every list: search, Advanced Search, filter popovers
  with live counts, `Fit to width | Comfortable` density, Column Toggle, Copy /
  Excel / CSV, sortable headers, expandable rows, and a footer with rows-per-page
  and `1–10 of N`.
- **Legible demo documents.** The document viewer renders a representment letter
  generated from the case record — its real reason code, amount, ARN, last-4,
  credit method and credit reference. A blurred placeholder teaches a reviewer
  nothing about the product.
- **Modals**: title, × close, required fields marked with a red asterisk, inline
  errors beneath the field, submit disabled until valid.

---

## Project structure

```
src/
  brand/       brand.config.js (the control file), BrandProvider, Wordmark
  domain/      statuses, caseTypes (adaptive columns), criteria engine,
               consolidation, metrics, report fields
  data/        seeded RNG, catalog, people, 1200 cases, work-case detail,
               alerts, rules, admin, navigation, permissions, content
  components/  ui/ charts/ layout/ cases/ workcase/
  pages/       one per route
  styles/      tokens (fallbacks), base, components
  utils/       format, export, storage, rule reordering
```

The book is generated from one fixed seed, so tables, charts and consolidation
groups are identical on every reload — but **dates anchor to `now()`**, so the
seed controls offsets, not the calendar. Presentment can never post-date today:
a short window (Amex + RFI computes to a negative window) is floored and the due
offset clamped.

---

## Deployment

`vercel.json` carries the SPA rewrite — without it, refreshing on
`/work-case/ARB-620008` 404s — and immutable cache headers on content-hashed
assets. CI runs `npm ci && npm run build` on push, pull request and manual
dispatch, and builds the second tenant too.

---

## Verification

```bash
npm test              # 75 assertions, ~9s
npm run test:watch
npm run test:coverage
```

CI runs the suite before the build, on push, PR and manual dispatch.

**What the suite covers**, chosen because each of these actually broke during
the build:

| File | Guards against |
|---|---|
| `pages.test.jsx` | White screens. `npm run build` passes on a dropped import or a stale `useMemo` dep — both are runtime `ReferenceError`s. Mounts all 26 pages, asserts real content, fails on any React error. Also renders the second tenant. |
| `data-invariants.test.js` | The generated book drifting: 1,200 cases at exactly 2:1, no post-dated presentment, an entity and queue on every case, prices on the `.99` ladder, consolidation inside the 10–15% band. |
| `data-table.test.jsx` | The table contract: Actions pinned first without a screen opting in, header/cell alignment agreeing, select-all clearing on a second click, sorting numerically, the toolbar staying reachable when a filter matches nothing. |
| `palette.test.js` | Colour claims. Recomputes contrast and CIEDE2000 under simulated protanopia and deuteranopia rather than trusting a comment. |
| `white-label.test.js` | Tenant leaks: hard-coded hexes or tenant names in components, British spellings, state read but never set, unused imports. |

Verified in this build:

- `npm test` — **75 passing**.
- `npm run build` passes for **both** tenants (`VITE_TENANT=arb` and `pch`).
- Data invariants, measured on both tenants via a bundled probe:
  1,200 cases, exactly **2:1** (800 / 400), **0** presentments post-dating today,
  **0** cases missing an entity or a queue, **0** purchase values off the `.99`
  ladder, consolidation at **13.2%** (158 cases, 64 groups, 13 cross-channel,
  5 double-refund-risk), and markets confined to the 12 configured states.
- **All 25 routes** mount and render content in a real browser at 1440×900 with
  **zero console errors**, checked in one scripted sweep.
- Sign-in, dashboard, case management, work-case detail (including the generated
  representment letter), alerts overview, reports center and system preferences
  inspected visually.
- Brand assets checked at every size they actually render: the lockup on the
  dark rail at 236px and on the sign-in panel, and the tile at 64 / 32 / 16px,
  where 16px is the size the document letterhead uses.
- Contrast measured, not eyeballed, and now asserted in `palette.test.js`
  rather than written down: `#5C1BF9` 7.05:1 on white, `#8A5EFF` 4.06:1 on the
  rail as a graphical object, and the chart ramp monotonic in L\*.

Not verified:

- No cross-browser testing beyond Chromium, no testing below 1280px, and no
  screen-reader pass. The suite runs in jsdom, which has no layout — it catches
  render failures and contract breaks, not visual regressions.
- Every brand color is sampled from ARB's own assets — see Palette provenance.
  `navRailDeep` is the one derived value, darkened from the sampled `navRail`.
- `public/tenant-pch.svg` is an authored placeholder mark for the second tenant.
  No PCH brand assets were supplied.
- Game titles, studio handles, staff and players are **invented**. No real
  content supplier is named, because naming one would imply a commercial
  relationship and attach fabricated dispute data to it.
