# Phase 3: API Layer & AI Integration
 
**Status:** Complete | **Test result:** 46/46 passing (21 engine + 16 explanation service + 9 API) | **Preceded by:** Phase 2 (diff engine)
 
---
 
## 1. What was built
 
| File | Responsibility |
|---|---|
| `src/config/logger.js` | Dependency-free structured JSON logging; silent under `NODE_ENV=test` |
| `src/middleware/validateRunInput.js` | Transport-level row shape validation, collects all errors at once |
| `src/services/aiClient.js` | Thin provider adapter — the only file that knows the vendor wire format |
| `src/services/explanationService.js` | Prompt construction, response schema validation, 16 rule-specific fallbacks |
| `src/services/runService.js` | Run orchestration: diff → explain → summarize → persist |
| `src/routes/runs.js` | Thin HTTP adapter: validate → delegate → map errors to status codes |
| `src/services/explanationService.test.js` | 16 tests, heavy on failure paths |
| `tests/api.test.js` | 9 integration tests over the real Express app |
 
---
 
## 2. Layering
 
```
route (HTTP concerns only)
  └─ runService (orchestration)
       ├─ diffEngine     [pure, Phase 2, no I/O]
       ├─ explanationService (prompt + schema validation + fallback)
       │    └─ aiClient  [only file that knows the vendor]
       └─ Run model      [best-effort persistence]
```
 
Each layer only knows the one below it. The route contains no business logic; `runService` contains no HTTP; `explanationService` contains no vendor specifics; `diffEngine` contains nothing but rules. Swapping AI providers touches exactly one file.
 
---
 
## 3. Design decisions
 
### 3.1 Two validation layers, two status codes
 
Validation is split deliberately, and the split is visible in the API contract:
 
- **400 — malformed shape.** Caught by middleware before the engine is reached: `kind` isn't a valid value, `required` isn't a boolean, `statusCode` isn't 100–599. This is "is this even a row?"
- **422 — well-formed but semantically invalid.** Caught inside the diff engine: empty table, duplicate composite key. This is "these are rows, but they don't form a valid comparison."
Semantic validation stays in the engine rather than moving up to middleware, so the engine remains correct when called directly — which is exactly how Phase 2's tests call it. Moving it up would make the engine trust its caller, and 21 unit tests would be testing a weaker guarantee.
 
Malformed rows report **every** error in one response rather than failing on the first. Someone pasting a 20-row table should not fix errors one request at a time.
 
### 3.2 The AI is never allowed to disagree
 
Three separate mechanisms enforce that classification is the rules engine's alone:
 
1. The system prompt states the classification is authoritative and final.
2. The model is asked only for `{key, explanation}` — there is no field in the response schema through which it *could* express a classification.
3. Any returned key not produced by the diff engine is discarded during parsing. A hallucinated change cannot enter the output.
This is the brief's central constraint ("AI is used for exactly one task"), enforced structurally rather than by hoping the prompt holds.
 
### 3.3 Graceful degradation is a tested property, not a claim
 
`generateExplanations` returns an empty `Map` on every failure mode — provider error, timeout, non-JSON response, JSON-but-not-an-array — and never throws. Each of those four paths has its own test.
 
When it degrades, 16 rule-specific fallback explanations take over, so the output is never blank or generic. `fallbackExplanation` is itself defensive: a malformed change object falls through to a generic form rather than throwing inside a `.map()`.
 
Every change carries `explanationSource: 'ai' | 'fallback'`, and each run carries `aiDegraded`. The UI can be honest about which text the model wrote — useful in the demo, and the right default for a tool an API tester is meant to trust.
 
### 3.4 The database is genuinely optional
 
`runService` checks `mongoose.connection.readyState` before attempting a write and logs a skip rather than throwing when disconnected. `POST /api/runs` returns `persisted: false` and `runId: null`; history endpoints return 503 with a clear message.
 
**The entire API test suite runs with no database connection.** That isn't a testing shortcut — it's the proof that persistence is off the critical path. If a reviewer asks "what happens if Mongo dies?", the answer is that the test suite already runs in that state.
 
### 3.5 Timeout on the AI call
 
`aiClient` uses `AbortController` with a configurable timeout (default 20s). Without it, a hung connection would hold the request open indefinitely and the graceful-degradation path would never fire — an unbounded wait is a worse failure than a fast fallback.
 
### 3.6 API key handling
 
The key is read from the server environment inside `aiClient` and never leaves the process. The frontend never contacts the provider. `.env` is gitignored; `.env.example` documents the variables with no values.
 
---
 
## 4. Test coverage added
 
**Explanation service (16):** happy path, code-fence tolerance, exactly-one-call batching, zero-change short-circuit, four degradation modes, three schema-validation cases (hallucinated keys, structurally invalid items, empty explanations), three fallback cases.
 
**API (9):** happy path with summary assertion, `explanationSource` tagging, full degradation with AI down, four validation cases across 400/422, two database-unavailable cases, health check.
 
The failure-path tests outnumber the happy-path ones roughly two to one. That ratio is intentional: the happy path is the part that would have been noticed anyway.
 
---
 
## 5. Known limitations
 
- **No retry on AI failure.** One attempt, then fall back. A retry would improve explanation quality at the cost of doubling worst-case latency; within an 8–10 hour scope the fallback is good enough that retrying isn't worth the complexity.
- **Batching means one bad response affects the whole run.** Accepted in ADR-002; schema validation salvages partial responses (valid items are kept, invalid siblings dropped), which covers the realistic case.
- **No rate limiting or auth.** Single-user assessment tool; would be table stakes for anything deployed.
- **History is capped at 50 with no pagination.** Sufficient for the demo; noted rather than built.
---
 
## 6. Demo notes
 
The most convincing thing to show here is the failure path. Set an invalid `AI_API_KEY`, run a comparison, and the full categorized diff still renders with rule-authored explanations and an `aiDegraded` flag. A system that visibly works with its "smart" component removed reads as engineered; one that only works on the golden path reads as assembled.

the api test cases 

PS C:\Users\Nandish Rao\OneDrive\Desktop\API Sentinal\backend> npm test 


 PASS  tests/api.test.js (57.953 s)
 PASS  src/services/explanationService.test.js
 PASS  src/diffEngine/diffEngine.test.js

Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        61.772 s
Ran all test suites.