// Fixture child for tests/mcp-host.standalone.test.ts: a process of its own sets SITE_URL and
// MCP_ALLOWED_HOSTS before the route module loads (it reads them once). The request cases travel as
// JSON in MCP_CASES.
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Fastify from "fastify";
const { registerMcp } = await import(pathToFileURL(path.join(process.cwd(), "apps/api/src/routes/mcp.ts")).href);
const app = Fastify();
registerMcp(app);
try {
  for (const { headers, status } of JSON.parse(process.env.MCP_CASES)) {
    const response = await app.inject({ method: "POST", url: "/api/mcp",
      payload: { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2026-07-28", capabilities: {}, clientInfo: { name: "probe", version: "0" } } },
      headers: { accept: "application/json, text/event-stream", ...headers } });
    assert.equal(response.statusCode, status, JSON.stringify(headers) + ": " + response.body);
    assert.equal(response.headers["cache-control"], "no-store");
  }
} finally { await app.close(); }
