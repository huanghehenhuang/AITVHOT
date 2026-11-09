// Media stays inert until activation. Playback then uses the browser’s native controls.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { chromium, webkit, expect, type Browser } from "@playwright/test";
import type { SiteItemDetail } from "@aihot/contracts/site";
import { startWebServer, type WebServer } from "./web-server.ts";

// Local VP8 color clip with no audio or third-party material.
const clip = await readFile(new URL("./fixtures/native-video.webm", import.meta.url));
const at = "2026-10-04T08:00:00.000Z";
let mediaRequests = 0;
let unsupportedRequests = 0;
const api = createServer((req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  if (url.pathname === "/video/clip.webm") {
    mediaRequests++;
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range ?? "");
    const start = range ? Number(range[1]) : 0;
    const end = range?.[2] ? Math.min(Number(range[2]), clip.length - 1) : clip.length - 1;
    res.writeHead(range ? 206 : 200, {
      "Content-Type": "video/webm", "Accept-Ranges": "bytes", "Content-Length": end - start + 1,
      ...(range ? { "Content-Range": `bytes ${start}-${end}/${clip.length}` } : {}),
    });
    return res.end(clip.subarray(start, end + 1));
  }
  if (url.pathname === "/video/unsupported") { unsupportedRequests++; res.writeHead(404); return res.end(); }
  res.setHeader("Content-Type", "application/json");
  if (url.pathname === "/api/site/meta") return res.end(JSON.stringify({ changelogVersion: "fixture" }));
  if (url.pathname === "/api/site/track") { res.statusCode = 204; return res.end(); }
  if (url.pathname === "/api/health") return res.end("{}");
  if (url.pathname === "/api/site/items/video-fixture") {
    const detail: SiteItemDetail = {
      id: "video-fixture", title: "原生视频检查", summary: "固定摘要", reason: "固定推荐理由", source: { name: "Fixture" },
      publishedAt: at, timelineAt: at, discoveredAt: at, category: "video-model", tags: [], score: 80, selected: true,
      channel: "news", x: null, originalTitle: "Video fixture", links: { original: "https://example.org/article" },
      story: null, readingMode: "full", author: null, outline: [], relatedStories: [], topics: [], indexable: true,
      markdownAvailable: true, group: null, hasTranslation: true, bodyLanguage: "zh",
      body: { zh: `<p>点击浏览器原生按钮播放视频。</p><video controls playsinline preload="none" width="320" height="320"><source src="${url.origin}/video/unsupported" type="video/not-supported"><source src="${url.origin}/video/clip.webm" type="video/webm"></video>`, original: null, zhKind: "translation", complete: true },
    };
    return res.end(JSON.stringify(detail));
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ code: "not_found" }));
});
let web: WebServer;
let chrome: Browser;
let safari: Browser;
before(async () => {
  const results = await Promise.allSettled([
    startWebServer(api).then((value) => { web = value; }),
    chromium.launch({ channel: "chromium" }).then((value) => { chrome = value; }),
    webkit.launch().then((value) => { safari = value; }),
  ]);
  for (const result of results) if (result.status === "rejected") throw result.reason;
});
after(async () => {
  await chrome?.close();
  await safari?.close();
  await web?.stop();
});

for (const engine of ["Chromium", "WebKit"] as const) {
  // Windows WebKit delegates decoding to Media Foundation. In the headless Windows runner
  // even a standalone same-origin <video> cannot decode the fixture. Still verify its fetch gate.
  const checkPlayback = engine !== "WebKit" || process.platform !== "win32";
  test(`${engine}: video waits for interaction and ${checkPlayback ? "plays and pauses" : "requests the supported source"}`, async () => {
    const browser = engine === "Chromium" ? chrome : safari;
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const beforeRequests = mediaRequests;
    try {
      await page.goto(web.origin + "/items/video-fixture");
      const video = page.locator(".prose video");
      const play = page.getByRole("button", { name: /播放视频|Play video/ });
      await expect(play).toBeVisible();
      await expect(video).toBeVisible();
      await expect(video).toHaveAttribute("preload", "none");
      assert.equal(await video.locator("source").count(), 2);
      assert.equal(await video.evaluate((node: HTMLVideoElement) => !node.controls && node.playsInline && node.paused && !node.autoplay && !node.loop), true);
      await page.waitForTimeout(300);
      assert.equal(mediaRequests, beforeRequests, "the tested browser does not preload the clip");
      await expect(video.locator("source[src]")).toHaveCount(0);
      await play.press("Enter");
      await expect(video).toHaveAttribute("controls", "");
      await expect.poll(() => mediaRequests).toBeGreaterThan(beforeRequests);
      assert.equal(unsupportedRequests, 0, "the browser skips the explicitly unsupported format");
      if (!checkPlayback) return;
      await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.currentTime)).toBeGreaterThan(0.5);
      assert.equal(await video.evaluate((node: HTMLVideoElement) => !node.paused && !node.ended), true);
      assert.match(await video.evaluate((node: HTMLVideoElement) => node.currentSrc), /\/video\/clip\.webm$/);
      const box = await video.boundingBox();
      assert.ok(box);
      await video.click({ position: { x: 30, y: box.height - (engine === "Chromium" ? 48 : 20) } });
      await expect.poll(() => video.evaluate((node: HTMLVideoElement) => node.paused && !node.ended)).toBe(true);
      const pausedAt = await video.evaluate((node: HTMLVideoElement) => node.currentTime);
      await page.waitForTimeout(300);
      const paused = await video.evaluate((node: HTMLVideoElement) => ({ paused: node.paused, ended: node.ended, currentTime: node.currentTime }));
      assert.deepEqual(paused, { paused: true, ended: false, currentTime: pausedAt }, "pause stops the clock before the clip ends");
    } finally {
      await context.close();
    }
  });
}
