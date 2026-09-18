# Phase 6: Rename Confidence Scoring

**Status:** Complete | **Test result:** 48/48 passing (+2 over Phase 2's 46) | **Type:** Could Have

---

## 1. What changed

The Phase 2 `possible-rename` heuristic (edge case #11) paired a removed field with an added
field when they shared a type and at least one word — a binary yes/no gate. Phase 6 adds a
confidence score on top of that gate, so a rename pairing now reads as a graded signal instead
of a flat verdict.

```
confidence = 0.6 × wordOverlap(jaccard) + 0.25 × requiredFlagMatch + 0.15 × nameLengthSimilarity
```

| Weight | Signal | Why this weight |
|---|---|---|
| 60% | Jaccard similarity of camelCase-split words | Strongest signal a rename has occurred — shared vocabulary is what a human reviewer would actually notice first |
| 25% | Required-flag match | A genuine rename rarely also flips required/optional in the same commit; a mismatch is a small but real reason to doubt the pairing |
| 15% | Name-length similarity | Weakest signal on its own (many unrelated fields happen to be similar length), kept as a minor tiebreaker rather than dropped entirely |

Labeled `high` (≥0.7), `medium` (≥0.4), or `low` (below 0.4).

---

## 2. Worked examples

| Pair | Word overlap | Required match | Length similarity | Confidence | Label |
|---|---|---|---|---|---|
| `fullName` → `displayName` (fixture) | 1/3 words shared ("name") | both optional (match) | 8 vs 11 chars | 0.56 | medium |
| `userEmail` → `userEmailAddress` (synthetic test) | 2/3 words shared ("user","email") | both optional (match) | 9 vs 16 chars | 0.73 | high |
| `password` → `referralCode` (fixture) | 0 words shared | — | — | *not paired* | gate rejects before scoring |

The third row matters as much as the first two: **the confidence scorer never runs unless the
existing word-overlap gate already accepted the pair.** Same type and same required flag alone
(true of `password`/`referralCode`) is not enough to trigger a rename candidate — both still
report independently as `field-removed` (breaking) and `field-added-required` (breaking), which
is the correct read for that pair.

---

## 3. Design decision: score, don't decide

Confidence is additive information on an already-`ambiguous` classification — it never promotes
a rename to a verdict, and it never demotes one back to independent remove/add. A `low`-confidence
rename is still reported as a rename for human review, just with an honest signal about how sure
the heuristic is. This follows the same principle as Phase 2's original design: heuristics resolve
to "flag for review," never to a confident answer they can't actually back up.

---

## 4. Where it surfaces

- **Diff engine output** — every `possible-rename` change now carries `confidence` and `confidenceLabel`
- **AI prompt** (`explanationService.toPromptPayload`) — the model sees `confidenceLabel` so it can
  mention it in the explanation, but never sees enough to second-guess the classification itself
- **Fallback text** — rules-authored fallback explicitly states the confidence label and score
- **UI** — `ChangeRow` shows a confidence badge only on `possible-rename` rows, colored to match severity

---

## 5. Test coverage added

- Fixture case (`fullName`/`displayName`) asserts the exact confidence value (0.56) and label (medium),
  not just presence of the fields — a regression that shifts the weights would be caught immediately
- Synthetic high-confidence case (`userEmail`/`userEmailAddress`) proves the score actually scales
  with similarity rather than being a fixed value dressed up as a score
- Explicit non-regression test confirming `password`/`referralCode` still resolve independently

## 6. Known limitation

Word-overlap-based scoring inherits Phase 2's limitation: a rename with zero shared vocabulary
(`fullName` → `label`) scores 0 and is never even offered as a candidate, regardless of how
confident a Levenshtein-distance approach might be. Accepted for the same reason as before — a
missed rename degrades safely to a correctly-reported remove + add; a false-positive rename
pairing would not.