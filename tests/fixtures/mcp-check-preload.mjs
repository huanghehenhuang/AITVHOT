// Fixture preload for tests/mcp-check.test.ts: replaces the site manifest module with the fixture's
// own SERVER_MODULES. The manifest URL and the replacement source arrive via MCP_MANIFEST_URL /
// MCP_PRELOAD_SOURCE.
import { registerHooks } from "node:module";
const manifestUrl = process.env.MCP_MANIFEST_URL;
const source = process.env.MCP_PRELOAD_SOURCE;
registerHooks({ load(url, context, next) {
  return url === manifestUrl ? { format: "module", source, shortCircuit: true } : next(url, context);
} });
