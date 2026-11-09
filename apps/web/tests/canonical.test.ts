import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer, request } from "node:http";
import { startWebServer } from "./web-server.ts";
import { canonicalRedirect } from "../app/lib/canonical.server.ts";
import { checkSeo } from "../../../scripts/seo-checks.ts";

const site = new URL("https://news.example");
const req = (host: string, proto = "https", url = "/topics/kling?from=feed") => ({ url, headers: { host, "x-forwarded-proto": proto } });

test("public host redirects preserve paths and queries without trusting a path as an authority", () => {
  assert.equal(canonicalRedirect(req("www.news.example"), site, true), "https://news.example/topics/kling?from=feed");
  assert.equal(canonicalRedirect(req("news.example", "http"), site, true), "https://news.example/topics/kling?from=feed");
  assert.equal(canonicalRedirect(req("WWW.NEWS.EXAMPLE", "http", "//evil.example/path?q=1"), site, true), "https://news.example//evil.example/path?q=1");
});

test("canonical HTTPS, local probes and unrecognized hosts do not redirect", () => {
  for (const host of ["news.example", "127.0.0.1:3000", "localhost:3000", "evil.example", "news.example.evil.example"]) {
    assert.equal(canonicalRedirect(req(host), site, true), null);
  }
  assert.equal(canonicalRedirect(req("news.example", "http"), site, false), null);
  assert.equal(canonicalRedirect(req("www.localhost:3000"), new URL("http://localhost:3000"), true), null);
});

const html = (canonical: string, extra = "") => `<!DOCTYPE html><html><head><link rel="canonical" href="${canonical}">${extra}</head><body>News</body></html>`;

test("SEO checks catch wrong SSR metadata even when a page returns success", () => {
  assert.match(checkSeo("/", html("http://localhost:3000/"), site.origin)!, /loopback/);
  assert.match(checkSeo("/", html("https://other.example/"), site.origin)!, /canonical/);
  assert.match(checkSeo("/", html(site.origin + "/wrong"), site.origin)!, /path/);
  assert.match(checkSeo("/", html(site.origin + "/", '<link rel="canonical" href="https://news.example/">'), site.origin)!, /exactly one/);
  assert.equal(checkSeo("/", html(site.origin + "/"), site.origin), null);
  assert.equal(checkSeo("/", html("http://localhost:3000/"), "http://localhost:3000"), null);
  assert.equal(checkSeo("/admin/login", '<!DOCTYPE html><meta name="robots" content="noindex, nofollow">', site.origin), null);
});

test("discovery checks inspect every sitemap location without fetching advertised hosts", () => {
  assert.equal(checkSeo("/robots.txt", "User-agent: *\nSitemap: https://news.example/sitemap.xml\n", site.origin), null);
  assert.ok(checkSeo("/robots.txt", "Sitemap: http://localhost:3000/sitemap.xml", site.origin));
  const sitemap = (urls: string[]) => `<urlset>${urls.map((url) => `<url><loc>${url}</loc></url>`).join("")}</urlset>`;
  assert.equal(checkSeo("/sitemap.xml", sitemap([site.origin + "/", site.origin + "/topics/kling"]), site.origin), null);
  assert.ok(checkSeo("/sitemap.xml", sitemap([site.origin + "/", "https://other.example/hidden"]), site.origin));
  assert.ok(checkSeo("/sitemap.xml", "<urlset/>", site.origin));
  assert.ok(checkSeo("/llms.txt", "[API](http://localhost:3000/api/v1/items)", site.origin));
  assert.equal(checkSeo("/llms.txt", "[Original](https://source.example/article)", site.origin), null);
});

test("HTTP server redirects before proxying, preserves methods and leaves canonical HTTPS requests alone", async () => {
  let hits = 0;
  const api = createServer((_req, res) => { hits++; res.end("ok"); });
  const web = await startWebServer(api, { SITE_URL: site.origin, TRUST_PROXY: "true" });
  try {
    const raw = (host: string, proto: string, method = "GET") => new Promise<{ status: number; location?: string; cache?: string }>((resolve, reject) => {
      const req = request({ hostname: "127.0.0.1", port: web.port, path: "/api/health?check=1", method,
        headers: { host, "x-forwarded-proto": proto } }, (res) => {
        res.resume();
        res.on("end", () => resolve({ status: res.statusCode!, location: res.headers.location, cache: res.headers["cache-control"] }));
      });
      req.on("error", reject);
      req.end();
    });
    for (const method of ["GET", "HEAD", "POST"]) {
      const r = await raw("www.news.example", "https", method);
      assert.equal(r.status, 308);
      assert.equal(r.location, "https://news.example/api/health?check=1");
      assert.equal(r.cache, "private, no-store");
    }
    assert.equal((await raw("news.example", "http")).status, 308);
    assert.equal(hits, 0);
    assert.equal((await raw("news.example", "https")).status, 200);
    assert.equal((await raw(`127.0.0.1:${web.port}`, "http")).status, 200);
    assert.equal(hits, 2);
  } finally { await web.stop(); }
});
