// Opens the site's main pages and machine exits and checks each answers: the whole-site check after a
// deploy, and CI's check of the built site on an empty database.
//   node scripts/smoke.ts [--base http://localhost:3000]
// Local targets are the default. Checking any other origin requires an explicit --live.
import { SITE } from "@aihot/site";

const at = process.argv.indexOf("--base");
const rawBase = (at > 0 ? process.argv[at + 1] : process.env.SITE_URL) ?? "http://localhost:3000";
const target = new URL(rawBase);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

/** Every request passes these checks immediately before it is sent. */
async function get(path: string, init?: RequestInit): Promise<Response> {
  const approved = new URL(path, target);
  if (!/^https?:$/.test(approved.protocol)) throw new Error(`unsupported protocol: ${approved.protocol}`);
  if (approved.origin !== target.origin) throw new Error(`outside the smoke target: ${path}`);
  if (!LOCAL_HOSTS.has(approved.hostname) && !process.argv.includes("--live")) {
    throw new Error(`refusing to check ${approved.origin}: pass --live to target a non-local origin`);
  }
  return await fetch(approved, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
}

const PAGES = ["/", "/all", "/hot", "/daily", "/daily/archive", "/topics", "/starred", "/agent", "/about", "/changelog", "/feedback", "/terms", "/privacy", "/more", "/admin/login"];
const MACHINE: Array<[path: string, type: RegExp]> = [
  ["/api/health", /json/],
  ["/api/v1/items", /json/],
  ["/api/v1/hot-topics", /json/],
  ["/api/v1/selected/snapshot", /json/],
  ["/feed.xml", /xml/],
  ["/feed/all.xml", /xml/],
  ["/llms.txt", /text\/plain/],
  ["/robots.txt", /text\/plain/],
  ["/sitemap.xml", /xml/],
  ["/manifest.webmanifest", /manifest/],
  ["/openapi-v1.json", /json/],
  ["/og/site.png", /image\/png/],
  ["/icon.png", /image\/png/],
  ["/favicon.ico", /icon/],
];

let failed = 0;
async function check(path: string, expect: (res: Response, body: string) => string | null) {
  try {
    const res = await get(path);
    const body = res.headers.get("content-type")?.startsWith("image/") ? "" : await res.text();
    const problem = res.status !== 200 ? `HTTP ${res.status}` : expect(res, body);
    console.log(`${problem ? "✗" : "✓"} ${path}${problem ? `  ${problem}` : ""}`);
    if (problem) failed += 1;
  } catch (error) {
    console.log(`✗ ${path}  ${String(error)}`);
    failed += 1;
  }
}

// Pages write the name as HTML text: a name such as "MyF&B" appears as "MyF&amp;B".
const htmlName = SITE.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
for (const path of PAGES) await check(path, (_res, body) => (body.includes(SITE.name) || body.includes(htmlName) ? null : `the page does not name ${SITE.name}`));
for (const [path, type] of MACHINE) await check(path, (res) => (type.test(res.headers.get("content-type") ?? "") ? null : `content-type ${res.headers.get("content-type")}`));
// The stylesheet the page names must actually be served. A rejected static path leaves every page
// answering 200 while its CSS and JS sit at 404, which no fixed-path check above would notice.
const home = await get("/");
const homeHtml = await home.text();
const asset = homeHtml.match(/\/assets\/[^"'\\]+\.css/)?.[0];
if (asset) await check(asset, (res) => (/^text\/css/.test(res.headers.get("content-type") ?? "") ? null : `content-type ${res.headers.get("content-type")}`));
else { console.log("✗ /  the page names no built stylesheet"); failed += 1; }
// Same class of miss for hydration: a stale in-memory manifest keeps naming JS that a
// rebuild deleted (2026-10-22), so the stylesheet check alone leaves the page inert.
const script = homeHtml.match(/\/assets\/[^"'\\]+\.js/)?.[0];
if (script) await check(script, (res) => (/javascript/.test(res.headers.get("content-type") ?? "") ? null : `content-type ${res.headers.get("content-type")}`));
else { console.log("✗ /  the page names no built script"); failed += 1; }
// MCP: the handshake answers with the site's server name.
const mcp = await get("/api/mcp", {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "1" } } }),
}).then((r) => r.text()).catch((e) => String(e));
const mcpOk = typeof mcp === "string" && mcp.includes(`"name":"${SITE.mcpPrefix}"`);
console.log(`${mcpOk ? "✓" : "✗"} /api/mcp initialize${mcpOk ? "" : `  ${mcp.slice(0, 200)}`}`);
if (!mcpOk) failed += 1;

console.log(failed ? `\n${failed} check(s) failed` : "\nall checks passed");
process.exit(failed ? 1 : 0);
