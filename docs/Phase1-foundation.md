# Phase 1: Foundations — ADRs & Repo Scaffold

## What was built
- ADR-001 (diff engine isolation) and ADR-002 (single-call AI batching)
- Row schema and composite key strategy (`docs/data-model.md`)
- Shared before/after fixtures deliberately authored to cover all 20 edge cases from
  the Phase 0 matrix, plus two malformed fixtures for the validation-error cases
- Backend scaffold: Express app, thin `runs` router, Mongoose `Run` model,
  diff engine module (interface only), explanation service (interface only)
- Test skeleton: 21 `.todo` tests, one per edge case, wired to the shared fixtures
- Frontend scaffold: Vite + React, boots end-to-end, UI intentionally deferred to Phase 5

## Why this shape
Nothing in Phase 1 does real work — the diff engine throws "not yet implemented" and the
explanation service is a stub. That's intentional. Phase 1's job is to make Phase 2 pure
implementation with zero design decisions left to make mid-flow: the interface, the test
list, and the data are already fixed. Writing the `.todo` tests now — one per edge case —
turns the Phase 0 matrix from a design artifact into an executable spec.



