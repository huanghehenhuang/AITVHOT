import type { IncomingMessage } from "node:http";

/** Normalize only the configured public host and its www alias. Loopback health checks stay local. */
export function canonicalRedirect(req: Pick<IncomingMessage, "url" | "headers">, site: URL, trustProxy: boolean): string | null {
  if (site.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname)) return null;
  const host = req.headers.host?.toLowerCase();
  const canonicalHost = site.host.toLowerCase();
  const alias = `www.${canonicalHost}`;
  if (host !== canonicalHost && host !== alias) return null;
  // Without a trusted proxy, the web server cannot infer the visitor's TLS connection.
  const http = trustProxy && req.headers["x-forwarded-proto"] === "http";
  if (host === canonicalHost && !http) return null;
  const path = req.url ?? "/";
  if (!path.startsWith("/") || /[\r\n]/.test(path)) return null;
  // Concatenation keeps //evil.test an origin-form path, never a different authority.
  return `${site.origin}${path}`;
}
