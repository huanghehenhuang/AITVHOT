import { load } from "cheerio";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Inspect response bodies only; never follow a URL found in an untrusted document. */
export function checkSeo(path: string, body: string, expectedOrigin: string): string | null {
  const expected = new URL(expectedOrigin);
  const sameOrigin = (value: string) => {
    try { return new URL(value).origin === expected.origin; } catch { return false; }
  };
  if (!LOOPBACK.has(expected.hostname) && /https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?=[:/\s"<)]|$)/i.test(body)) {
    return "public document contains a loopback URL";
  }
  if (path === "/robots.txt") {
    const maps = [...body.matchAll(/^Sitemap:\s*(\S+)\s*$/gim)].map((m) => m[1]);
    return maps.includes(`${expected.origin}/sitemap.xml`) ? null : "robots.txt does not advertise the expected sitemap";
  }
  if (path === "/sitemap.xml") {
    const xml = load(body, { xml: true });
    const locations = xml("urlset > url > loc").toArray().map((el) => xml(el).text());
    if (!locations.length) return "sitemap has no URL entries";
    return locations.every(sameOrigin) ? null : "sitemap contains a URL outside the expected origin";
  }
  if (!/^\s*(?:<!doctype html|<html[\s>])/i.test(body)) return null;
  const html = load(body);
  const links = html('head link[rel="canonical"]');
  const noindex = html('meta[name="robots"]').toArray().some((el) => /\bnoindex\b/i.test(html(el).attr("content") ?? ""));
  if (!links.length && noindex) return null;
  if (links.length !== 1) return "page must have exactly one canonical link";
  const canonical = links.attr("href") ?? "";
  if (!sameOrigin(canonical)) return "canonical does not use the expected origin";
  if (new URL(canonical).pathname !== new URL(path, expected).pathname) return "canonical does not match the page path";
  for (const property of ["og:url", "og:image"]) {
    const value = html(`meta[property="${property}"]`).attr("content");
    if (value && !sameOrigin(value)) return `${property} does not use the expected origin`;
  }
  for (const script of html('script[type="application/ld+json"]').toArray()) {
    try { JSON.parse(html(script).text()); } catch { return "page has invalid JSON-LD"; }
  }
  return null;
}
