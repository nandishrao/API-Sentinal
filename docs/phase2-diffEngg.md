Phase 2: Diff Engine — Test-First Implementation

Status: Complete | Test result: 21/21 passing | Preceded by: Phase 1 (scaffold, ADRs, fixtures)

1. What was built
src/diffEngine/rules.js — classification policy: type-widening table, enum comparison, required-flag transitions, name-similarity helpers
src/diffEngine/diffEngine.js — orchestration: validation, endpoint grouping, field diff, status diff
src/diffEngine/diffEngine.test.js — 21 assertions, one per edge-case-matrix row, replacing the Phase 1 .todo skeleton

No I/O, no Express, no MongoDB, no AI client anywhere in this layer — ADR-001 held for the whole phase.

2. Process followed

Every test was converted from .todo to a real assertion before the corresponding rule was implemented, then the rule was written until the test went green. The Phase 1 skeleton made this possible: the full list of 21 cases was fixed before any logic existed, so there was no scope drift mid-implementation and no "I'll add that test later."

Where the shared fixtures didn't naturally exercise a rule (plain type change #4, enum-value-added #13, nested dot-path #20), the test constructs a minimal two-row input inline rather than bloating the demo fixtures with cases that don't tell a story. The fixtures stay readable as demo data; the tests stay exhaustive. That split is deliberate and worth stating if asked.


Test Case Execution [No I/O, no Express, no MongoDB, no AI ]

C:\Users\Nandish Rao\OneDrive\Desktop\API Sentinal\backend> npm test


 PASS  src/diffEngine/diffEngine.test.js
  diffEngine — classification rules
    √ #1 field removed -> breaking (POST /users.password) (7 ms)
    √ #2 field added, optional -> non-breaking (PATCH /users/{id}.notes) (2 ms)
    √ #3 field added, required -> breaking (POST /users.referralCode) (1 ms)
    √ #4 type changed -> breaking (non-widening case) (1 ms)
    √ #5 type widened (int32 -> int64) -> ambiguous (POST /users.age) (3 ms)
    √ #6 required -> optional -> non-breaking (POST /users.isActive) (4 ms)
    √ #7 optional -> required -> breaking (POST /users.username) (1 ms)
    √ #8 status code removed -> breaking (POST /users status 400) (2 ms)
    √ #9 status code added -> non-breaking (PATCH /users/{id} status 429) (1 ms)
    √ #10 status code changed, same operation -> breaking (PATCH /users/{id} 200 -> 204) (1 ms)
    √ #11 field removed + field added, same endpoint/type -> ambiguous possible-rename (fullName -> displayName) (1 ms)
    √ #12 enum value removed -> breaking (POST /users.role: guest removed) (2 ms)
    √ #13 enum value added -> non-breaking (2 ms)
    √ #14 field reordering only -> no change reported (GET /users/{id}.id / createdAt) (1 ms)
    √ #15 endpoint removed entirely -> breaking, reported at endpoint scope (DELETE /users/{id}) (1 ms)
    √ #16 endpoint added entirely -> non-breaking (POST /users/{id}/verify) (1 ms)
    √ #17 duplicate composite key -> validation error, not a diff result (50 ms)
    √ #18 empty table -> validation error, not a diff result (4 ms)
    √ #19 field name casing changed -> ambiguous (GET /users.userId -> userid) (2 ms)
    √ #20 nested field path (dot notation) -> treated like any other field key (1 ms)
    √ end-to-end: fixture pair produces the expected totals (2 ms)

Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
Snapshots:   0 total
Time:        1.42 s, estimated 2 s
Ran all test suites.