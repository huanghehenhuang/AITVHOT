// Failure cases: an HTTP/2 idle socket error must not kill the process after a completed fetch;
// direct requests, proxy destinations, HTTPS proxies and DNS-over-HTTPS must all negotiate HTTP/1.1.
// Routing to a checked IP must keep the original Host, SNI and certificate validation intact.
import "./setup.ts";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { promisify } from "node:util";

const exec = promisify(execFile);
const directory = await mkdtemp(path.join(os.tmpdir(), "outbound-protocol-"));
const cert = path.join(directory, "cert.pem");
const key = path.join(directory, "key.pem");
await exec("openssl", ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", cert,
  "-days", "1", "-subj", "/CN=outbound.invalid", "-addext",
  "subjectAltName=DNS:outbound.invalid,DNS:cloudflare-dns.com,IP:127.0.0.1,IP:93.184.216.34"]);
after(() => rm(directory, { recursive: true, force: true }));

for (const route of ["direct", "proxy", "secure-proxy", "dns"] as const) {
  test(`outbound ${route} negotiates HTTP/1.1 and retains TLS identity`, async () => {
    const { stdout } = await exec("node", ["--", "tests/fixtures/outbound-protocol-worker.mjs"], {
      cwd: new URL("../", import.meta.url), timeout: 10000,
      env: { ...process.env, EGRESS_PROXY_URL: "", ALLOW_PRIVATE_NETWORK_FETCH: "false", NODE_EXTRA_CA_CERTS: cert,
        TEST_TLS_KEY: key, TEST_OUTBOUND_ROUTE: route },
    });
    const result = JSON.parse(stdout) as { requests: Array<{ version: string; host: string; sni: string }>; tunnels: string[]; proxyProtocols: string[]; error: string | null };
    assert.equal(result.error, null, JSON.stringify(result));
    assert.ok(result.requests.length > 0);
    assert.ok(result.requests.every(request => request.version === "1.1"), JSON.stringify(result));
    if (route === "proxy" || route === "secure-proxy") {
      assert.deepEqual(result.tunnels, ["93.184.216.34:443"]);
      assert.equal(result.requests[0]!.host, "outbound.invalid");
      assert.equal(result.requests[0]!.sni, "outbound.invalid");
    }
    if (route === "secure-proxy") assert.deepEqual(result.proxyProtocols, ["http/1.1"]);
    if (route === "dns") {
      assert.ok(result.requests.every(request => request.host === "cloudflare-dns.com" && request.sni === "cloudflare-dns.com"));
    }
  });
}
