import assert from "node:assert/strict";
import { test } from "node:test";
import { browserLocale, languagePath, resolveLocale, localeTag, ogLocale } from "../app/i18n/locale.ts";

const req = (url: string, cookie?: string) => new Request(url, cookie ? { headers: { cookie } } : {});

test("locale defaults to Chinese and admin stays Chinese", () => {
  assert.equal(resolveLocale(req("http://localhost/hot")), "zh");
  assert.equal(resolveLocale(req("http://localhost/admin/sources", "locale=en")), "zh");
  assert.equal(localeTag("zh"), "zh-CN");
  assert.equal(ogLocale("en"), "en_US");
});

test("?lang= wins over the cookie", () => {
  assert.equal(resolveLocale(req("http://localhost/hot?lang=en")), "en");
  assert.equal(resolveLocale(req("http://localhost/hot?lang=zh", "locale=en")), "zh");
  assert.equal(resolveLocale(req("http://localhost/hot", "locale=en")), "en");
  assert.equal(resolveLocale(req("http://localhost/hot?lang=nope", "locale=en")), "en");
});

test("first visits honor weighted browser languages before trusted location", () => {
  assert.equal(browserLocale("zh-CN;q=0.4,en-US;q=0.9"), "en");
  assert.equal(browserLocale("en;q=0,zh-Hant;q=0.5"), "zh");
  assert.equal(browserLocale("en;q=bad,zh;q=2"), null);
  const visit = (headers: Record<string, string>, path = "/") => new Request(`https://example.org${path}`, { headers });
  assert.equal(resolveLocale(visit({ "accept-language": "en-GB", "cf-ipcountry": "CN" }), true), "en");
  assert.equal(resolveLocale(visit({ "cf-ipcountry": "US" }), true), "en");
  assert.equal(resolveLocale(visit({ "cf-ipcountry": "TW" }), true), "zh");
  assert.equal(resolveLocale(visit({ "cf-ipcountry": "US" }), false), "zh");
  assert.equal(resolveLocale(visit({ "cf-ipcountry": "XX" }), true), "zh");
  assert.equal(resolveLocale(visit({ cookie: "locale=zh", "accept-language": "en" })), "zh");
  assert.equal(resolveLocale(visit({ "accept-language": "en", "cf-ipcountry": "US", "user-agent": "Googlebot" }), true), "zh");
  assert.equal(resolveLocale(visit({ "user-agent": "Googlebot" }, "/?lang=en"), true), "en");
  assert.equal(languagePath("/all?category=video-model&lang=zh#top", "en"), "/all?category=video-model&lang=en#top");
  assert.equal(languagePath("//", "en"), "/?lang=en");
  assert.equal(languagePath("//other.example/path", "en"), "/other.example/path?lang=en");
});
