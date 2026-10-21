import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveLocale, localeTag, ogLocale } from "../app/i18n/locale.ts";

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
