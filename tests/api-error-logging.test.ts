// Failure cases: an API restart emits a deprecated-options warning; a failing request has only a
// request id and cannot be located; query strings or authentication headers enter the journal;
// changing logging also changes the established Problem JSON or its headers; suppressing ordinary
// request logs also suppresses a real stream error after response headers have already gone out.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

test("API startup is quiet and an unexpected error retains the request, stack and response contract", () => {
  const result = spawnSync("node", ["--", "tests/fixtures/api-error-logging-worker.mjs"], {
    cwd: new URL("..", import.meta.url), encoding: "utf8", timeout: 15000,
    env: { ...process.env, DATABASE_URL: "postgres://127.0.0.1/aihot_logging_test", AIHOT_CREDENTIALS_DIR: "/nonexistent-test-credentials", LOG_LEVEL: "info" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  const records = result.stdout.trim().split("\n").map((line) => JSON.parse(line));
  const error = records.find((record) => record.msg === "unhandled");
  assert.ok(error);
  assert.equal(error.method, "GET");
  assert.equal(error.path, "/api/log-check");
  assert.ok(error.reqId);
  assert.equal(error.err.type, "TimeoutError");
  assert.equal(error.err.message, "upstream timed out");
  assert.match(error.err.stack, /\s+at /);
  assert.ok(!result.stdout.includes("private-"));
  assert.ok(!records.some((record) => /incoming request|request completed/.test(record.msg)));
  assert.equal(records.filter((record) => record.path === "/api/log-check").length, 1);
  assert.equal(records.filter((record) => record.path === "/api/logged").length, 1);
  assert.equal(records.find((record) => record.path === "/api/logged")?.msg, "upstream failed");
  assert.equal(records.filter((record) => record.path === "/api/unlogged").length, 1);
  assert.equal(records.find((record) => record.path === "/api/unlogged")?.status, 503);
  const mcpError = records.find((record) => record.msg === "mcp tool failed");
  assert.ok(mcpError);
  assert.equal(mcpError.path, "/api/mcp");
  assert.equal(mcpError.method, "POST");
  assert.ok(mcpError.reqId);
  assert.equal(mcpError.err.type, "Error");
  assert.equal(mcpError.err.message, "mcp upstream failure");
  assert.match(mcpError.err.stack, /\s+at /);
  const streamError = records.find((record) => record.path === "/api/stream" && record.err);
  assert.ok(streamError);
  assert.equal(streamError.err.type, "Error");
  assert.equal(streamError.err.message, "stream exploded");
  assert.match(streamError.err.stack, /\s+at /);
  for (const path of ["/api/busy-public", "/api/busy-site"]) {
    const busy = records.filter((record) => record.path === path);
    assert.equal(busy.length, 1);
    assert.equal(busy[0].reason, "search_capacity_exhausted");
    assert.equal(busy[0].status, 503);
  }
});
