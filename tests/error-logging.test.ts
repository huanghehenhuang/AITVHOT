// Failure cases: PostgreSQL includes entire values in duplicate-key detail and invalid-input
// messages; nested causes repeat those values; an OAuth provider's error text contains credentials.
// Each case runs tests/fixtures/<name>.mjs in its own process (spawn args are literal) and asserts on
// the pino output that process wrote to stdout.
import "./setup.ts";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const MARKER = "synthetic-private-person@example.test";
const SPAWN = { cwd: new URL("..", import.meta.url), encoding: "utf8" as const, timeout: 15_000,
  env: { ...process.env, LOG_LEVEL: "error", MODEL_CALLS_ENABLED: "false", COLLECT_ENABLED: "false" } };

test("API error logs keep database codes and frames without row values or query parameters", () => {
  const result = spawnSync("node", ["--", "tests/fixtures/error-logging-db.mjs"], { ...SPAWN, stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout;
  assert.ok(!output.includes(MARKER), "database values must not enter the log");
  assert.match(output, /23505/);
  assert.match(output, /22P02/);
  assert.match(output, /at /, "keep locations useful for diagnosis");
  assert.ok(!output.includes("parameters") && !output.includes("detail"));
});

// One process for every failed exchange: a refusal whose text names credentials, and token or profile
// answers that are not JSON (the parser would quote them).
test("OAuth rejects failed exchanges without logging the upstream response text", () => {
  const marker = "opaque-secret";
  const result = spawnSync("node", ["--", "tests/fixtures/error-logging-oauth.mjs"], { ...SPAWN, stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout;
  assert.ok(!output.includes(MARKER) && !output.includes(marker), "the identity provider's text is not safe log data");
  assert.match(output, /400/, "the upstream HTTP status remains diagnosable");
  assert.match(output, /502/);
});

test("the queue's PostgreSQL driver also keeps values out of worker error logs", () => {
  const result = spawnSync("node", ["--", "tests/fixtures/error-logging-queue.mjs"], { ...SPAWN, stdio: ["ignore", "pipe", "pipe"] });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!result.stdout.includes(MARKER));
  assert.match(result.stdout, /22P02/);
});
