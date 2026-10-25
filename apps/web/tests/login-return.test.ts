// The ?return= whitelist of the login page: same-site paths pass, everything that could turn the
// post-sign-in redirect off-site falls back to "/" — including the backslash form, which browsers
// read as protocol-relative ("no US-001 regressions").
import assert from "node:assert/strict";
import { test } from "node:test";
import { safeLoginReturn } from "../app/lib/return.ts";

test("same-site paths pass through", () => {
  assert.equal(safeLoginReturn("/"), "/");
  assert.equal(safeLoginReturn("/starred?x=1"), "/starred?x=1");
});

test("off-site and protocol-relative targets fall back to the home path", () => {
  assert.equal(safeLoginReturn("//evil.example.com"), "/");
  assert.equal(safeLoginReturn("/\\evil.com"), "/");
  assert.equal(safeLoginReturn("/\\/evil.example.com"), "/");
  assert.equal(safeLoginReturn("https://evil.example.com/login"), "/");
  assert.equal(safeLoginReturn("javascript:alert(1)"), "/");
  assert.equal(safeLoginReturn(""), "/");
});
