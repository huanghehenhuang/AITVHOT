// Failure cases: the document's own stylesheet is not served from the client build (a request for it
// answers something other than the built CSS), and a path that escapes the client build is served.
// The assertions name only build output that exists on the committed sources, so they hold before the
// next client build too.
import assert from "node:assert/strict";
import { createServer, request } from "node:http";
import { after, before, test } from "node:test";
import { startWebServer, type WebServer } from "./web-server.ts";

let web: WebServer;
const api = createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  if (req.url === "/api/site/meta") return res.end(JSON.stringify({ changelogVersion: null }));
  if (req.url?.startsWith("/api/site/timeline")) return res.end(JSON.stringify({
    cards: [], nextCursor: null, dayCounts: {}, hot: [], filters: { category: null, channel: null, tag: null },
  }));
  res.writeHead(404);
  res.end("{}");
});

before(async () => { web = await startWebServer(api); });
after(() => web.stop());

function raw(path: string) {
  return new Promise<{ status: number; headers: import("node:http").IncomingHttpHeaders; body: string }>((resolve, reject) => {
    const req = request({ hostname: "127.0.0.1", port: web.port, path, method: "GET" }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode!, headers: res.headers, body }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

test("the stylesheet the document names is served from the client build", async () => {
  const home = await raw("/");
  assert.equal(home.status, 200, web.logs());
  const stylesheet = home.body.match(/<link[^>]+href="([^"]+\.css)"/);
  assert.ok(stylesheet, "the document must name its built stylesheet");
  const asset = await raw(stylesheet[1]!);
  assert.equal(asset.status, 200, `${stylesheet[1]} must be served: ${web.logs()}`);
  assert.match(asset.headers["content-type"] ?? "", /^text\/css/);
  assert.match(asset.headers["cache-control"] ?? "", /immutable/);
  assert.match(asset.body, /--bg:/, "the body is the built stylesheet");
});

test("a path that escapes the client build is not served", async () => {
  const escaping = ["/assets/%2e%2e/%2e%2e/package.json", "/assets/%2e%2e/%2e%2e/server.ts", "/%2e./package.json", "/%5c..%5c..%5cpackage.json"];
  for (const path of escaping) {
    const res = await raw(path);
    assert.notEqual(res.status, 200, `${path} must not answer 200: ${web.logs()}`);
    assert.doesNotMatch(res.body, /"name"\s*:\s*"aihot"/, `${path} leaked the repository package.json`);
    assert.doesNotMatch(res.body, /async function serveStatic/, `${path} leaked the web server source`);
  }
});
