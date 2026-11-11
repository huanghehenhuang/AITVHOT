// Shared by administrator intake and industry-pack imports, so aliases follow the same rules.
import { normalizeUrl } from "../lib/url.ts";
import { sha256 } from "../lib/ids.ts";

function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => [key, ordered(item)]));
  return value;
}

/** The address or account a source collects from. Unknown push sources have no identity. */
export function sourceIdentity(kind: string, config: Record<string, unknown>): string | null {
  const raw = (config.feedUrl ?? config.url ?? config.listUrl ?? config.endpoint ?? null) as string | null;
  if (kind === "x_search") {
    const m = /from:([A-Za-z0-9_]{1,15})/.exec(String(config.query ?? ""));
    return m ? `x:${m[1]!.toLowerCase()}` : null;
  }
  if (kind === "mp_account") {
    const id = String(config.ghid ?? config.wxid ?? "").trim().toLowerCase();
    return id ? `mp:${id}` : null;
  }
  if (!raw) return null;
  try {
    const url = normalizeUrl(String(raw).replace(/^https:\/\/r\.jina\.ai\//, "")) ?? String(raw);
    const method = String(config.method ?? "GET").toUpperCase();
    if (method === "GET") return url;
    // Public POST listings can share an endpoint while selecting different authors or topics.
    const encoding = config.bodyForm ? "form" : "json";
    const body = ordered(config.bodyForm ?? config.bodyJson ?? null);
    return `${url}#${method}:${encoding}:${sha256(JSON.stringify(body))}`;
  } catch {
    return String(raw);
  }
}
