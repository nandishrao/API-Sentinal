## 1. Project Defination

**API Breaking Change Detector is a tool that compares two versions of an API contract, identifies breaking and non-breaking changes such as removed fields, type changes, required-flag changes, and status-code changes, and uses AI to provide clear, plain-English explanations for the detected differences.**


this project is implemented phase wise 

## 2. Senior-Level Requirements

### 2.1 Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | System accepts two flattened endpoint-field tables ("before" and "after"), ~15–20 rows each, via file upload (CSV/JSON) or paste-in |
| FR-2 | System performs a deterministic, rule-based diff between before/after on a composite key (endpoint + field path) |
| FR-3 | System classifies every detected change into: **Breaking**, **Non-breaking**, or **Ambiguous/Needs-review** |
| FR-4 | System detects: field removed, field added, type changed, required-flag changed, status code changed/removed/added |
| FR-5 | For every detected change, system calls an LLM exactly once per change (or batched once per run) to produce a plain-English explanation |
| FR-6 | System outputs: (1) categorized change list, (2) plain-English explanation per change, (3) overall breaking-change count + summary |
| FR-7 | System persists each comparison run (input snapshot + results) so a candidate/reviewer can revisit past runs — this is your "database" story for the MERN stack, and it doubles as demo material ("here's a run from this morning") |
| FR-8 | System surfaces its classification rules/assumptions in the UI — not just the answer, but *why* |

### 2.2 Non-Functional Requirements (this is where seniority is judged)

| Category | Requirement | Why it matters in the room |
|---|---|---|
| **Correctness** | Diff engine is unit-tested against every edge case in §4, not just the happy path | This is the artifact architects will actually poke at live |
| **Determinism** | Same input → same classification, always. AI output may vary in wording, never in classification | Proves you understood the brief's core constraint |
| **Separation of concerns** | Diff engine has zero knowledge of AI/HTTP; it's a pure function you can unit-test with no network calls | Textbook layering — cheap to say, expensive to fake if you didn't actually build it that way |
| **Resilience** | AI call failure degrades gracefully — the categorized diff list still renders even if the explanation call times out/errors | Shows you don't treat the "smart" part as load-bearing infrastructure |
| **Input validation** | Malformed rows, missing columns, duplicate endpoint+field keys, empty tables all produce clear errors, not crashes | Fresher candidates skip this; it's a cheap, high-signal win |
| **Observability** | Structured server-side logging per run (row counts in, changes out, AI latency) | One paragraph in your README, ~20 minutes of work, disproportionate credibility |
| **Security hygiene** | AI API key lives server-side only, never shipped to the frontend bundle | Table-stakes, but frequently gotten wrong — say it explicitly |
| **Documentation** | Every phase has a doc; architecture decisions have a one-paragraph rationale (ADR-lite) | This is literally requirement #5 you gave yourself — keep it lightweight, not a thesis |



## 3. Feature List — MoSCoW (this is where you *resist* over-engineering)

### Must Have (this is what's actually scored — build this first, build it well)
- Upload/paste before & after tables
- Deterministic diff engine covering all rule types in §4
- Classification: Breaking / Non-breaking / Ambiguous
- Single-purpose AI call for plain-English explanation, with graceful fallback
- Three required outputs (categorized list, per-change explanation, summary/count)
- Unit tests for the diff engine (aim for one test per edge case row in §4)
- README + short architecture note + a documented assumptions list

### Should Have (differentiators, cheap relative to their impact)
- Run history (MongoDB) — "here are 3 runs from testing this week" is a strong demo beat
- CSV *and* JSON input support (shows you thought about real-world data shapes)
- A rules-config object (not hardcoded if/else) so classification logic is visible and swappable in the demo — great answer to "how would you add a new rule type?"

### Could Have
- Confidence score or "possible rename" heuristic (field removed + field added of same type in same endpoint → flag as likely rename, not two separate changes) — this is the single most "principal-level" edge case you can handle, see §4
- Export report as PDF/JSON
- Basic auth on run history (multi-user)

### Won't Have
- Live OpenAPI/Swagger spec parsing (brief explicitly says raw parsing is not required)
- Multi-user real-time collaboration
- Non-REST protocol support (GraphQL, gRPC schema diffing)
- Auto-fix/auto-migration suggestions

## 4. Edge Case Matrix — the actual differentiator

This table *is* your test suite. Each row should become a unit test with a name matching the "Rule" column.

| # | Change | Classification | Notes / Handling |
|---|---|---|---|
| 1 | Field removed | **Breaking** | Always breaking — existing clients reference it |
| 2 | Field added, optional | **Non-breaking** | Additive, backward compatible |
| 3 | Field added, required | **Breaking** | Existing clients won't send it → request fails validation |
| 4 | Type changed (e.g. string → int) | **Breaking** | Flag regardless of direction — client-side parsing assumptions break |
| 5 | Type widened (int32 → int64, or narrower numeric → broader) | **Ambiguous** | Technically often safe, but flag for review — don't silently pass |
| 6 | Required → Optional | **Non-breaking** | Relaxing a constraint is safe |
| 7 | Optional → Required | **Breaking** | Tightening a constraint is not |
| 8 | Status code removed (e.g. 404 no longer returned) | **Breaking** | Clients with error-handling logic for that code now behave undefined |
| 9 | Status code added | **Non-breaking** | New response path, doesn't invalidate existing client logic |
| 10 | Status code changed (200 → 201 for same operation) | **Breaking** | Semantic change even if "just a number" — call this out explicitly, it's a common trap |
| 11 | Field removed + new field added (same endpoint, same type, similar name) | **Ambiguous — possible rename** | Don't report as unrelated add+remove; flag as a likely rename needing human confirmation. This is your Could-Have differentiator |
| 12 | Enum value removed from a field | **Breaking** | Existing values sent by client may now be invalid |
| 13 | Enum value added | **Non-breaking** | Additive |
| 14 | Field reordered in the table (no semantic change) | **Non-breaking / ignore** | Diff key must be field name, not row position — this is a correctness trap, not a feature |
| 15 | Endpoint present in "before," entirely absent in "after" | **Breaking** | Whole-endpoint removal, report at endpoint level, not silently dropped |
| 16 | Endpoint present only in "after" (new endpoint) | **Non-breaking** | New capability |
| 17 | Duplicate composite key (same endpoint+field appears twice in one table) | **Validation error** | Reject the run with a clear message — don't silently pick one row |
| 18 | Empty/missing table | **Validation error** | Explicit error, not a crash or an empty success state |
| 19 | Field name casing changed (`userId` → `userid`) | **Ambiguous** | Depends on case-sensitivity of the API; flag rather than auto-decide |
| 20 | Nested field path (if you support dot notation, e.g. `address.zip`) | **Handled like any other field** | Only take this on if your table format supports it — don't invent scope |


---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  React (Vite) Frontend                                        │
│  - Table input (upload/paste)                                 │
│  - Results view: categorized diff + explanations + summary    │
│  - Run history view                                           │
└───────────────────────────┬────────────────────────────────────┘
                             │ REST (Axios)
┌───────────────────────────▼────────────────────────────────────┐
│  Express API Layer                                             │
│  - /api/runs POST   (submit before/after tables)               │
│  - /api/runs GET    (history)                                  │
│  - /api/runs/:id GET                                           │
│  - Input validation middleware                                 │
└───────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                                          ▼
┌───────────────────┐                  ┌────────────────────────┐
│  Diff Engine        │                  │  Explanation Service    │
│  (pure functions,   │──── changes ────▶│  (single-purpose AI     │
│  zero I/O, unit-    │                  │  call, isolated behind  │
│  tested exhaustively│                  │  an interface; failure  │
│  against §4)        │                  │  degrades gracefully)   │
└───────────────────┘                  └────────────────────────┘
        │
        ▼
┌───────────────────┐
│  MongoDB            │
│  Run { input,       │
│  changes, summary,  │
│  createdAt }         │
└───────────────────┘
```

**Key architectural decisions (state these as ADRs, one paragraph each — don't over-produce this):**

1. **Diff engine is a pure module with no dependency on Express, Mongo, or the AI client.** It takes two arrays of `{endpoint, field, type, required, statusCode}` and returns a `Change[]`. This is what makes it unit-testable in isolation and is the single strongest engineering signal in the whole project.
2. **AI is called once per run (batched), not once per field**, to control latency and cost, and because the brief scopes it to "turning each detected diff into an explanation" — a single call with structured output covers this without N network round-trips.
3. **Classification lives in a rules table/config, not inline conditionals.** Trivial to implement, but it's the difference between "I hardcoded some ifs" and "I built a small rules engine" in how it reads to three architects.
4. **MongoDB is used for run persistence only — it is not on the critical path of the diff logic.** If Mongo is down, the diff/explain flow should still work; only history saving fails. Say this out loud — it demonstrates you think about blast radius.
5. **Rename detection (edge case #11) is heuristic, not authoritative** — flagged for human review rather than auto-resolved. Good architects don't pretend heuristics are certainties.

---

## 6. SDLC — kept intentionally lightweight

Full SDLC, compressed to fit an 8–10hr build without becoming theatre:

1. **Requirements & Design** (this document + ADRs) — done before code
2. **Data modeling** — define the row shape, sample before/after tables (15–20 rows, deliberately include every edge case from §4 so your demo data *is* your test data)
3. **Core diff engine, test-first** — write the edge-case tests from §4 before the implementation. This is the phase where "process" is most visible to a reviewer who asks to see your commit history
4. **API layer** — thin Express layer wrapping the engine, input validation
5. **AI integration** — isolated service, mockable, with a fallback path
6. **Frontend** — results view first, history view second 
7. **Testing pass** — confirm every §4 row has a passing test; add a couple of API-level integration tests (check with demo before & after data)
8. **Documentation** — README, ADR log, assumptions list, "what I'd do with more time" section
9. **Demo rehearsal** — walk through §9 below out loud, twice

---

## 7. Phase-Wise Build Plan (This is mapped across from the start)

| Day | Phase | Output | Doc produced |
|---|---|---|---|
| 1 | Requirements & Design | This charter, finalized; ADR-001 (diff-engine isolation), ADR-002 (AI batching) | `phase0-design.md` |
| 2 | Data modeling + sample data | `before.json`/`after.json` covering all 20 edge cases; row schema defined | `data-model.md` |
| 3 | Diff engine (TDD) | Pure diff module + full test suite against §4 | `phase3-diff-engine.md` |
| 4 | API layer + AI integration | Express routes, validation, explanation service w/ fallback | `phase4-api-ai.md` |
| 5 | Frontend | Upload/paste UI, results view, history view | `phase5-frontend.md` |
| 6 | Integration testing + polish | End-to-end run, error-path testing, README | `phase6-testing.md` |


