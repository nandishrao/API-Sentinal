# Phase 5: Integration, Verification & Demo Prep
 
**Status:** Complete | **Preceded by:** Phase 4 (frontend)
 
---
 
## 1. End-to-end verification
 
Ran both servers locally (`backend: npm run dev` on :4000, `frontend: npm run dev` on :5173,
Vite proxying `/api`), clicked **Load sample data**, clicked **Run comparison**.
 
**Result: exact match to the Phase 2 test predictions** — 14 total changes, 7 breaking,
4 non-breaking, 3 ambiguous. Same numbers the automated suite asserts, produced by clicking
through the real UI against the real (not-yet-AI-configured) backend. This is the single most
convincing verification available: the browser, the API, and the test suite all agree on the
same input without anyone hand-tuning anything to make it agree.
 
`AI_API_KEY` was not yet set at this point, so the run correctly triggered the ADR-002
degradation path — every explanation came from the rules-engine fallback, and the summary
panel surfaced the "AI explanation call did not succeed" notice. **This is expected, tested
behavior**, not a bug to fix before the demo. It's the failure-path proof that Phase 3's test
suite already covers, now visible end-to-end in the browser