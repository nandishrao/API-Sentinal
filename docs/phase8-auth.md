# Phase 8: Optional Multi-User Auth

**Status:** Complete | **Test result:** 19/19 new tests passing (72/72 cumulative) | **Type:** Could Have

---

## 1. What was built

- `User` model (username, bcrypt password hash)
- `authService` — register/login, JWT issuance and verification
- `requireAuth` middleware — 401s on a missing/malformed/invalid Bearer token
- `POST /api/auth/register`, `POST /api/auth/login` — always mounted
- `/api/runs` gated behind `requireAuth` **only when `REQUIRE_AUTH=true`** — off by default
- `Run.userId` — nullable, populated when auth is on, `null` otherwise
- Compact optional sign-in panel in the frontend left rail

---

## 2. The one design decision that mattered: default off

This was explicitly a "Could Have — only if time permits" item in the Phase 0 charter, meaning
it was never allowed to become a precondition for anything already built. `REQUIRE_AUTH` is read
once at module load in `routes/runs.js`; when unset (the default), `router.use(requireAuth)` is
never even called, and every route behaves exactly as it did at the end of Phase 5.

**Proof, not just a claim:** all 46 tests from Phases 1–5, plus the 7 added in Phases 6–7, pass
completely unmodified with this phase's code in place. Auth was built as a layer added on top,
not a refactor of what existed — the safest possible way to add a Could-Have without risking a
Must-Have.

---

## 3. Design decisions

### 3.1 Two auth test strategies, honestly separated

`authService` and `requireAuth` are fully unit-tested — the former by mocking the `User` model
(same pattern as `explanationService` mocking `aiClient` in Phase 3), the latter with real JWTs
and no database at all. Both run in this sandbox with no live MongoDB.

What's **not** fully verified here: true per-user history isolation — that user A's `GET /api/runs`
never returns user B's runs — because asserting that requires two real persisted `Run` documents
with different `userId`s, which requires a live database this environment doesn't have. What *is*
verified without a database is the access-control layer around it: unauthenticated requests get
401 before the persistence check ever runs (`authRunsAccess.test.js`), and the query-scoping code
(`Run.find({ userId: req.userId })`) is a one-line, low-risk piece of logic that's easy to verify
by reading. Flagging this honestly, the same way the AI-key path was flagged in Phase 5, rather
than claiming full coverage.

### 3.2 404, not 403, for another user's run

`GET /api/runs/:id` returns 404 rather than 403 when the run exists but belongs to a different
user. A 403 confirms the run exists; a 404 doesn't. Small detail, standard practice, worth stating
out loud if asked — it's the kind of thing that's invisible when done right and looks careless
when skipped.

### 3.3 Generic error message on login failure

"Invalid username or password" is returned identically whether the username doesn't exist or the
password is wrong. Distinguishing the two would let an attacker enumerate valid usernames.

### 3.4 Token storage in localStorage — a stated tradeoff, not an oversight

The frontend stores the JWT in `localStorage` and attaches it via an axios interceptor. This is
vulnerable to XSS in a way an HttpOnly cookie wouldn't be. Accepted here because: this is a
single-user assessment tool with no user-generated content rendered unsanitized anywhere in the
app (the one XSS vector that would matter), and implementing HttpOnly cookies properly needs a
backend-for-frontend session layer that would be genuine scope creep for a Could-Have feature.
Worth naming this tradeoff unprompted if asked about the auth design — it's a stronger answer
than pretending it isn't a tradeoff.

---

## 4. Test coverage added (19 total)

- **`authService.test.js` (9)** — registration validation (username/password length, duplicate
  username), password hashing invoked correctly, generic error message on both login failure
  modes, token issue/verify round-trip, rejection of a garbage token
- **`requireAuth.test.js` (4)** — 401 on missing header, wrong scheme, and malformed token;
  successful pass-through with `userId`/`username` attached on a valid token
- **`authRunsAccess.test.js` (6)** — the real Express app, `REQUIRE_AUTH=true`, in its own Jest
  module registry so it never affects the other 66 tests that assume auth is off: 401 without a
  token on both `POST` and `GET /api/runs`, 200 with a valid token (diff/explain flow works with
  zero database), 401 on a garbage token, and confirmation that auth is checked *before* the
  persistence-availability check (an unauthenticated caller can't learn whether the DB is up)

---

## 5. Known limitations

- Per-user history isolation is implemented but only verifiable end-to-end against a live
  MongoDB — see §3.1
- No password reset, no email verification, no refresh tokens — a 12-hour JWT with no renewal
  path, appropriate for a demo, not for anything real
- No rate limiting on `/api/auth/login` — brute-force protection was out of scope the same way
  general API rate limiting was flagged out of scope back in `phase3-api-ai.md` §5
- `localStorage` token storage — see §3.4