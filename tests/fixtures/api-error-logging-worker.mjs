// Fixture child for tests/api-error-logging.test.ts: builds the API with one module and several
// routes, exercises them, and lets the parent assert on this process's pino stdout.
import assert from "node:assert/strict";
import { buildApp } from "../../apps/api/src/app.ts";
import { installModules } from "@aihot/backend/modules";
import { mcpToolName } from "@aihot/contracts/mcp";
import { z } from "zod";
import { Readable } from "node:stream";
import { publicHandler } from "../../apps/api/src/routes/v1.ts";
import { siteHandler } from "../../apps/api/src/routes/site.ts";
import { SearchBusyError } from "@aihot/backend/publication/pool";
installModules([{ name: "logging-test", agent: { abilities: [{
  path: "/log-check", title: "log check", ask: "log check", answer: async () => "", etagPrefix: "log", cacheControl: "no-store",
  mcp: { tool: "log_check", use: "for tests", description: "log check", input: z.strictObject({}), run: async () => { throw new Error("mcp upstream failure"); } },
}] } }]);
const app = await buildApp();
app.get("/api/log-check", async () => { throw new DOMException("upstream timed out", "TimeoutError"); });
app.get("/api/logged", async (req, reply) => {
  req.log.warn({ err: new Error("known upstream failure") }, "upstream failed");
  return reply.code(502).send("upstream unavailable");
});
app.get("/api/unlogged", async (_req, reply) => reply.code(503).send("busy"));
app.get("/api/busy-public", publicHandler(async () => { throw new SearchBusyError(5); }));
app.get("/api/busy-site", siteHandler(async () => { throw new SearchBusyError(5); }));
app.get("/api/stream", async (_req, reply) => reply.type("text/plain").send(Readable.from((async function* () {
  yield "started";
  await new Promise(resolve => setTimeout(resolve, 10));
  throw new Error("stream exploded");
})())));
const res = await app.inject({ method: "GET", url: "/api/log-check?token=private-query", headers: { authorization: "Bearer private-auth", cookie: "private-cookie" } });
assert.equal(res.statusCode, 503);
assert.equal(res.headers["retry-after"], "30");
assert.equal(res.headers["cache-control"], "no-store");
assert.equal(res.headers["content-type"], "application/problem+json");
assert.equal(res.json().code, "temporarily_unavailable");
assert.equal(res.json().requestId, res.headers["x-request-id"]);
assert.equal((await app.inject({ url: "/api/logged" })).statusCode, 502);
assert.equal((await app.inject({ url: "/api/unlogged" })).statusCode, 503);
for (const url of ["/api/busy-public", "/api/busy-site"]) {
  const busy = await app.inject({ url: url + "?q=private-query" });
  assert.equal(busy.statusCode, 503);
  assert.equal(busy.headers["retry-after"], "5");
  assert.equal(busy.json().code, "temporarily_unavailable");
  assert.equal(busy.json().reason, undefined);
}
const mcp = await app.inject({ method: "POST", url: "/api/mcp?aihot_actor=private-actor", headers: {
  host: "localhost", "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2026-07-28", "mcp-method": "tools/call", "mcp-name": mcpToolName("log_check"),
}, payload: { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: mcpToolName("log_check"), arguments: {},
  _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} },
} } });
assert.equal(mcp.statusCode, 200, mcp.body);
assert.ok(mcp.body.includes("internal_error"), mcp.body);
assert.ok(!mcp.body.includes("mcp upstream failure"));
await app.inject({ url: "/api/stream?token=private-stream" }).catch(() => {});
await app.close();
