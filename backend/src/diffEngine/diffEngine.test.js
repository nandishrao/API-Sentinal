const { diff } = require('./diffEngine');
const before = require('../../tests/fixtures/before.json');
const after = require('../../tests/fixtures/after.json');
const malformedDuplicate = require('../../tests/fixtures/malformed-duplicate.json');
const malformedEmpty = require('../../tests/fixtures/malformed-empty.json');

/**
 * Every test name below maps 1:1 to a row in the Phase 0 edge case matrix.
 * `.todo` marks intent before implementation (Phase 1) — Phase 2 replaces each
 * `.todo` with a real assertion, test-first, against the shared fixtures above.
 * Running `npm test` at any point in the week shows exactly how much of the
 * matrix is covered — this list itself is a status report.
 */

describe('diffEngine — classification rules', () => {
  test.todo('#1 field removed -> breaking (POST /users.password)');
  test.todo('#2 field added, optional -> non-breaking (PATCH /users/{id}.notes)');
  test.todo('#3 field added, required -> breaking (POST /users.referralCode)');
  test.todo('#4 type changed -> breaking');
  test.todo('#5 type widened (int32 -> int64) -> ambiguous (POST /users.age)');
  test.todo('#6 required -> optional -> non-breaking (POST /users.isActive)');
  test.todo('#7 optional -> required -> breaking (POST /users.username)');
  test.todo('#8 status code removed -> breaking (POST /users status 400)');
  test.todo('#9 status code added -> non-breaking (PATCH /users/{id} status 429)');
  test.todo('#10 status code changed, same operation -> breaking (PATCH /users/{id} 200 -> 204)');
  test.todo('#11 field removed + field added, same endpoint/type -> ambiguous possible-rename (fullName -> displayName)');
  test.todo('#12 enum value removed -> breaking (POST /users.role: guest removed)');
  test.todo('#13 enum value added -> non-breaking');
  test.todo('#14 field reordering only -> no change reported (GET /users/{id}.id / createdAt)');
  test.todo('#15 endpoint removed entirely -> breaking, reported at endpoint scope (DELETE /users/{id})');
  test.todo('#16 endpoint added entirely -> non-breaking (POST /users/{id}/verify)');
  test.todo('#17 duplicate composite key -> validation error, not a diff result');
  test.todo('#18 empty table -> validation error, not a diff result');
  test.todo('#19 field name casing changed -> ambiguous (GET /users.userId -> userid)');
  test.todo('#20 nested field path (dot notation) -> treated like any other field key');

  test.todo('diff(before, after) end-to-end -> matches full expected Change[] for the fixture pair');
});
