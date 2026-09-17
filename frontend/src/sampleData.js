/**
 * Same data as backend/tests/fixtures/{before,after}.json — duplicated here
 * (not fetched) so the "Load sample" button works with zero backend calls and
 * zero build-step coupling between the two packages. Known tradeoff: if the
 * backend fixtures change, this file needs a manual sync — acceptable for an
 * assessment-scoped project, flagged in docs/phase4-frontend.md.
 */
export const sampleBefore = [
  { "endpoint": "POST /users", "kind": "field", "field": "email", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "password", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "age", "type": "int32", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "role", "type": "enum", "required": true, "enumValues": ["admin", "user", "guest"], "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "username", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "isActive", "type": "boolean", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 201 },
  { "endpoint": "POST /users", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 400 },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "id", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "createdAt", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "fullName", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 },
  { "endpoint": "PATCH /users/{id}", "kind": "field", "field": "email", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "PATCH /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 },
  { "endpoint": "DELETE /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 204 },
  { "endpoint": "GET /users", "kind": "field", "field": "userId", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 }
];

export const sampleAfter = [
  { "endpoint": "POST /users", "kind": "field", "field": "email", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "age", "type": "int64", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "role", "type": "enum", "required": true, "enumValues": ["admin", "user"], "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "username", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "isActive", "type": "boolean", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "field", "field": "referralCode", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 201 },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "createdAt", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "id", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "field", "field": "displayName", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 },
  { "endpoint": "PATCH /users/{id}", "kind": "field", "field": "email", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "PATCH /users/{id}", "kind": "field", "field": "notes", "type": "string", "required": false, "enumValues": null, "statusCode": null },
  { "endpoint": "PATCH /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 204 },
  { "endpoint": "PATCH /users/{id}", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 429 },
  { "endpoint": "GET /users", "kind": "field", "field": "userid", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "GET /users", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 },
  { "endpoint": "POST /users/{id}/verify", "kind": "field", "field": "token", "type": "string", "required": true, "enumValues": null, "statusCode": null },
  { "endpoint": "POST /users/{id}/verify", "kind": "status", "field": null, "type": null, "required": null, "enumValues": null, "statusCode": 200 }
];