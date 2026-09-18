# Phase 7: PDF Export

**Status:** Complete | **Test result:** 5/5 new tests passing (53/53 cumulative) | **Type:** Could Have

---

## 1. What was built

`POST /api/reports/pdf` — accepts `{ changes, summary }` (the exact shape the frontend already
holds in state after a run) and streams back a PDF: title, generated timestamp, summary line,
then each change grouped by severity (breaking → needs review → non-breaking, matching the UI
ordering), with endpoint, field/status, explanation, rule name, and — for rename changes — the
Phase 6 confidence label.

`src/reports/pdfReport.js` does the rendering with `pdfkit`; `src/routes/reports.js` is the thin
HTTP wrapper. Frontend: `downloadRunAsPdf()` in `api/client.js` requests the PDF as a blob and
triggers a browser download; an "Export PDF" button sits next to the Summary heading.

---

## 2. Design decisions

### 2.1 Keyed by result shape, not by runId

The endpoint takes the changes/summary directly rather than `GET /api/reports/pdf/:runId`. This
was the one real design choice in this phase: a runId-keyed endpoint would make export a
database-dependent feature — the one place in the app where persistence stopped being optional.
That would contradict ADR-001's whole premise. Keying off the result shape means export works
identically whether the run was saved, failed to save because Mongo was down, or was never meant
to be saved at all.

### 2.2 Streamed, not buffered

`pdfkit`'s document is a writable stream; `res` is a writable stream. `doc.pipe(res)` connects
them directly — no temp file on disk, no full PDF held in memory before sending the first byte.
For a ~20-row report this doesn't matter for performance, but it's the version of this code that
doesn't need rewriting if report size grows.

### 2.3 Page-break awareness

Each change estimates its own rendered height before drawing, and calls `doc.addPage()` if it
won't fit on the current page. A report that splits one change's explanation across a page break
reads as unfinished — small thing, cheap to get right, visible if you get it wrong in the exact
document you're about to hand an architect.

---

## 3. Test coverage

- Valid run → 200, correct `Content-Type`, correct `Content-Disposition` filename pattern, and a
  `%PDF` magic-byte check on the response body — proves an actual PDF came back, not just a
  200 with the right headers
- A run with more changes produces a strictly larger file than an empty one — a cheap sanity
  check that content is actually being written, not just a static template
- 400 on missing `changes` or missing `summary`
- Zero-change run still returns a valid PDF (200, not an error) — an "all clear" report is a
  legitimate output, not an edge case to reject

---

## 4. Known limitations

- No PDF caching — every export re-renders from scratch. Irrelevant at this scale (~20 rows,
  sub-100ms render), would matter if report size grew by orders of magnitude
- No custom branding/logo — plain text report, appropriate for an assessment deliverable
- `pdfkit`'s default font (Helvetica) only — no custom font embedding, keeps the dependency
  surface and output file size small