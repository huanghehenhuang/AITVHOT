// Failures: a legitimate response can exceed the default header limit; a larger allowance must
// apply only to its configured host, also through a proxy, and never follow a redirect elsewhere.
// Responses beyond that allowance and redirects to private addresses must still be rejected.
// The child runs tests/fixtures/outbound-headers-worker.mjs with --experimental-test-module-mocks.
import "./setup.ts";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { promisify } from "node:util";

const exec = promisify(execFile);
for (const route of ["direct", "proxy"] as const) {
  test(`outbound ${route} keeps larger response headers confined to one host`, async () => {
    const { stdout } = await exec("node", ["--experimental-test-module-mocks", "--", "tests/fixtures/outbound-headers-worker.mjs"], {
      cwd: new URL("../", import.meta.url), timeout: 20000,
      env: { ...process.env, EGRESS_PROXY_URL: "", ALLOW_PRIVATE_NETWORK_FETCH: "false", TEST_HEADER_ROUTE: route },
    });
    const { results, requests } = JSON.parse(stdout) as {
      results: Record<string, { text?: string; error?: string; cause?: string }>;
      requests: string[];
    };
    assert.equal(results.configured?.text, "ok", JSON.stringify(results));
    for (const key of ["ordinary", "oversize", "redirect"]) assert.equal(results[key]?.cause, "UND_ERR_HEADERS_OVERFLOW", JSON.stringify(results));
    assert.match(results.private?.error ?? "", /Blocked/);
    assert.equal(requests.includes("/private-dest"), false);
  });
}
