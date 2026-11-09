import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { chromium, expect } from "@playwright/test";
import { startWebServer } from "./web-server.ts";

test("monochrome homepage preserves mobile filters, bookmarks, navigation and appearance", async () => {
  const at = "2026-10-29T08:00:00.000Z";
  const api = createServer((req, res) => {
    const url = new URL(req.url!, "http://api.local");
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/api/site/meta") return res.end('{"changelogVersion":null}');
    const category = url.searchParams.get("category");
    const channel = url.searchParams.get("channel") ?? "all";
    const item = { id: "monochrome-fixture", title: category ? `分类 ${category}` : "黑白界面中的真实资讯标题", summary: "保留来源、时间、收藏与筛选功能。", reason: "供读者快速了解进展。", category: category ?? "video-model", tags: [], source: { name: "测试来源" }, score: 80, selected: true, channel: "news", x: null, publishedAt: at, timelineAt: at };
    if (url.pathname === `/api/site/items/${item.id}`) return res.end(JSON.stringify({ ...item, originalTitle: null, links: { original: "https://example.org/article" }, discoveredAt: at, story: null, readingMode: "full", author: null, body: null, outline: [], relatedStories: [], topics: [{ slug: "video-gen", name: "视频生成" }], indexable: true, markdownAvailable: false, group: null, hasTranslation: false, bodyLanguage: "zh" }));
    if (url.pathname === "/api/site/hot") return res.end(JSON.stringify({
      computedAt: at,
      windowHours: 48,
      entries: Array.from({ length: 5 }, (_, i) => ({
        rank: i + 1, story: { publicId: `story-${i}`, title: `行业热点 ${i + 1}` }, trend: "unknown", trendPct: null,
        heat: 10, badges: [], participantCount: 0, sourceCount: 0, sourceNames: [], participants: [], spark: [],
      })),
    }));
    if (url.pathname === "/api/site/timeline") return res.end(JSON.stringify({ filters: { channel, category, tag: null }, cards: [{ key: item.id, item, anchorAt: at, group: null }, { key: "second", item: { ...item, id: "second", title: "第二条精选" }, anchorAt: at, group: null }], dayCounts: { "2026-10-29": 2 }, hot: [], nextCursor: null }));
    if (url.pathname === "/api/site/topics") return res.end('{"groups":[],"topics":[]}');
    res.statusCode = 404;
    res.end("{}");
  });
  const web = await startWebServer(api);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ locale: "zh-CN", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(web.origin);
    await expect(page.getByRole("link", { name: "黑白界面中的真实资讯标题", exact: true })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator(".home-lead").getByRole("button", { name: "收藏", exact: true }).click();
    await expect(page.locator(".home-lead").getByRole("button", { name: "取消收藏", exact: true })).toHaveAttribute("aria-pressed", "true");
    const ranking = page.locator(".home-ranking");
    await expect(ranking.getByText("更新延迟")).toBeVisible();
    await expect(ranking.locator("li:visible")).toHaveCount(3);
    const density = page.getByRole("button", { name: "详细模式" });
    await expect(page.locator(".home-feed .editorial-reason")).toHaveCount(0);
    await density.click();
    await expect(density).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".home-feed .editorial-reason")).toHaveAttribute("open", "");
    await page.reload();
    await expect(density).toHaveAttribute("aria-pressed", "true");
    await density.click();
    for (const width of [320, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow at ${width}px`);
    }
    await expect(ranking.locator("li:visible")).toHaveCount(5);
    // The summary and blank padding use the title's real link; controls keep their own actions.
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const card = page.locator(".home-lead");
      await expect(page).toHaveURL(web.origin + "/");
      const summary = await card.locator(".editorial-item-summary").boundingBox();
      assert.ok(summary);
      await page.mouse.click(summary.x + summary.width / 2, summary.y + summary.height / 2);
      await expect(page).toHaveURL(/\/items\/monochrome-fixture$/);
      await expect(page.locator("h1")).toHaveText("黑白界面中的真实资讯标题");
      await expect(page.getByRole("link", { name: /浏览「视频生成」相关资源/ })).toHaveAttribute("href", /\/knowledge\?tag=.*&status=ok$/);
      await page.waitForTimeout(350); // Let the navigation's view transition finish before Back.
      await page.goBack();
      await expect(card).toBeVisible();
      const bounds = await card.boundingBox();
      assert.ok(bounds);
      await card.click({ position: { x: 8, y: bounds.height - 4 } });
      await expect(page).toHaveURL(/\/items\/monochrome-fixture$/);
      await page.waitForTimeout(350);
      await page.goBack();
      await expect(card).toBeVisible();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "筛选", exact: true }).click();
    await page.getByRole("dialog").getByRole("link", { name: "创作工具", exact: true }).click();
    await expect(page).toHaveURL(/category=tool/);
    await page.getByRole("link", { name: "仅看官方一手" }).click();
    await expect(page).toHaveURL(/category=tool&channel=firstParty/);
    await page.getByRole("link", { name: "取消官方一手筛选" }).click();
    await expect(page).toHaveURL(/category=tool$/);
    await page.locator(".editorial-menu summary").click();
    await page.locator(".editorial-menu-panel").getByRole("radio", { name: "浅色", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.locator(".editorial-primary-nav")).toBeVisible();
    await page.locator(".editorial-theme-switch").getByRole("radio", { name: "深色", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    if (process.env.HOME_SCREENSHOTS) {
      await page.goto(web.origin);
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `${process.env.HOME_SCREENSHOTS}/home-dark-${width}.png`, animations: "disabled" });
      }
      await page.locator(".editorial-theme-switch").getByRole("radio", { name: "浅色", exact: true }).click();
      for (const width of [390, 768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `${process.env.HOME_SCREENSHOTS}/home-light-${width}.png`, animations: "disabled" });
      }
    }
    await page.getByRole("link", { name: "查看全部主题 →", exact: true }).click();
    await expect(page).toHaveURL(/\/topics$/);
    await page.goto(web.origin);
    await page.locator(".home-ranking").getByRole("link", { name: "怎么算" }).click();
    await expect(page).toHaveURL(/\/hot#hot-method$/);
    await expect(page.locator("#hot-method")).toHaveAttribute("open", "");
    await expect(page.getByText("更新延迟").filter({ visible: true })).toBeVisible();
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
    await web.stop();
  }
});
