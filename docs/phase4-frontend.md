# Phase 4: Frontend
 
**Status:** Complete | **Build:** `npm run build` passes clean | **Preceded by:** Phase 3 applia(API + AI)
 
---
 
## 1. Design plan (worked through before writing any component)
 
This is a review tool for engineers triaging API risk — closer in spirit to a diff viewer or a code review tool than a marketing page. The design plan was chosen against that, not against a generic "clean SaaS dashboard" default.
 
**Color** — cool neutral paper, not the warm-cream/terracotta combination that's become the generic AI-generated default:
- `--bg: #f6f6f4`, `--surface: #ffffff`, `--ink: #1b1e1f`, `--ink-muted: #62696d`, `--border: #dfe1df`
- `--accent: #2452c7` (technical blue for primary actions — deliberately not orange, to avoid reading as "themed after the tool that built it")
- Severity: `--breaking: #b3261e`, `--ambiguous: #8a5a00`, `--nonbreaking: #1d7a4c` — desaturated, closer to a terminal/git-diff palette than a bright traffic-light UI kit
**Type** — two families, each doing one job:
- Inter (sans) for UI chrome, labels, prose explanations
- IBM Plex Mono for anything that is literally a token from the API contract — endpoint paths, field names, types, rule names. Mono usage is grounded in the subject matter (API contracts are code) rather than applied as generic "data label" decoration.
**Layout** — fixed left rail (input + summary) + main pane (change log), not a centered single-column form:
```
+------------------+---------------------------------------------+
| API Breaking       | Breaking (7)                                |
| Change Detector     | endpoint · field · rule · explanation       |
|                     | ...                                          |
| [New run][History]  | Needs review (3)                            |
|                     | ...                                          |
| Before [paste/upl]  | Non-breaking (4)                            |
| After  [paste/upl]  | ...                                          |
| [Load sample]        |                                              |
| [Run comparison]     |                                              |
|                     |                                              |
| Summary              |                                              |
|  Total change  14    |                                              |
|  Breaking       7    |                                              |
+------------------+---------------------------------------------+
```
This mirrors how a reviewer actually works a diff tool: controls stay put on the left, the log scrolls independently on the right.
 
**Principles**
- Severity is never color-alone: every change row carries a colored left border, a background tint, *and* a text label ("Breaking" / "Needs review" / "Non-breaking"), so it still reads in grayscale or for a colorblind viewer.
- Rows, not cards. Hairline left-border + divider, no rounded-corner-and-shadow card soup, no gradient washes.
- Breaking changes list first within the results — a reviewer triaging risk needs the dangerous items before the safe ones, not in insertion order.
- Sample-data button exists specifically for the demo: paste-a-large-JSON-blob-live is a bad look in front of three architects; one click loading the exact fixture the test suite runs against is not.
**Self-check against the known generic tells** (see frontend-design skill) — confirmed avoided: no warm-cream+terracotta, no near-black+neon accent, no numbered-marker sequence where the content isn't a sequence, no ALL-CAPS eyebrow labels, no middle-dot-joined meta strings (an early draft used one between rule name and explanation source — caught and replaced with a plain divider), no trailing arrows on buttons.
 
---
 
## 2. What was built
 
| File | Responsibility |
|---|---|
| `src/styles.css` | Design tokens (CSS custom properties) + base element styles |
| `src/api/client.js` | Axios wrapper; `messageFromError` normalizes both validation-detail and plain-error response shapes |
| `src/sampleData.js` | Demo convenience — mirrors the backend fixtures (see §4, known limitation) |
| `src/components/TableInput.jsx` | Paste or upload before/after JSON; client-side JSON.parse only |
| `src/components/SummaryBar.jsx` | Vertical stat list + AI-degraded / not-persisted notices |
| `src/components/ChangeList.jsx` | Groups changes by classification, breaking first; empty state |
| `src/components/ChangeRow.jsx` | One change: endpoint, field/status, severity label, explanation, rule name, explanation source |
| `src/components/RunHistory.jsx` | Lists past runs, loads a selected one back into the main view |
| `src/App.jsx` | Tab state (New run / History), submit flow, error handling |
 
---
 
## 3. Design decisions
 
### 3.1 No client-side reimplementation of server rules
`TableInput` only does `JSON.parse` — row-shape validation (Phase 3 middleware) and semantic validation (Phase 2 engine) both stay server-side. Duplicating them client-side would create two sources of truth that could drift; the UI trusts the API's error response and displays it directly via `messageFromError`.
 
### 3.2 Explanation source is shown, not hidden
Every `ChangeRow` shows whether its explanation came from the AI or the rules-engine fallback. This makes Phase 3's degradation path visible in the UI rather than just true in the backend — directly supports the demo beat in the Phase 0 charter ("kill the AI call, show the diff still renders").
 
### 3.3 History reuses the results view instead of a separate one
Selecting a past run in `RunHistory` populates the exact same `result` state the New Run flow produces, so `ChangeList`/`SummaryBar` render identically either way. One rendering path for "a set of changes," regardless of where it came from — less code, and it can't drift into two inconsistent views of the same data shape.
 
### 3.4 Inline styles over a CSS framework
No Tailwind, no component library. For a ~7-component app this keeps the dependency surface at exactly `react` + `axios`, which is easier to explain and audit live than "here's why we pulled in a 40kb utility framework for eight components." Design tokens still live centrally in `styles.css`, so this isn't "no system," it's "no framework."
 
---
 
## 4. Known limitations
 
- **`sampleData.js` duplicates the backend fixtures** rather than fetching them, so the frontend demo works with zero backend dependency for that one button. Tradeoff: the two copies can drift if the backend fixtures change — acceptable for an assessment-scoped project, called out here rather than hidden.
- **No client-side row-count or size limit on paste.** The brief bounds tables to ~15-20 rows; a production version would cap paste size and show a row counter.
- **Run history has no pagination UI** even though the API caps at 50 — matches the Phase 3 scope decision, not an oversight.
- **No optimistic UI / retry on submit.** A failed request just shows the error and lets the user press the button again — appropriate for a single-user assessment tool, not for production.
---
 
## 5. Verification
 
`npm run build` completes with no errors or warnings (Vite 5, 93 modules, ~68KB gzipped). Not yet covered: component-level tests (React Testing Library) — deliberately deferred; the diff engine and API layer carry the correctness burden for this project, and UI tests would be marginal value against the remaining time budget. Flagged here rather than silently skipped.