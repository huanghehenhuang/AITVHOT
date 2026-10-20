# 审查漏报台账

记录逃过审查、事后才发现的缺陷。每条写明原审查范围、漏报原因、新增防线和回归验证，供下一次审查对照。

## 2026-10-13 · serveStatic 路径校验把全部静态资源判出界（P0）

**发现问题**：`apps/web/server.ts` 的 `serveStatic()` 改成 `path.resolve(rootDir, decoded)` 加 `startsWith(rootDir + path.sep)` 后恒返回 false。`decoded` 取自 `req.url` 的 path、必以 `/` 开头，而 `path.resolve` 遇绝对段会重置到盘根，于是 `build/client` 下唯一的 `assets/` 全部 404。页面本身仍返回 200，站点只是没有 CSS 和 hydration：线上从 2026-10-03 22:58 起就是这个状态，直到 2026-10-13 审查才发现。修复为 `path.resolve(rootDir, \`.\${decoded}\`)`（提交 3a228bd）。

**原审查范围**：提交 dfe5a5b（security-hardening: Mimosa L3 真实高危清零），基准 86e5c87。

**漏报原因**：

1. `.mimosa/` 台账里观测到本次改动的唯一运行是 `inconclusive`：`coverage.status: partial`、`scanning 19 required / 0 scanned / 19 failed`（`spawnSync ... ETIMEDOUT`）、`candidate_limit_exceeded` 另丢 12 个文件；`apps/web/server.ts`、`apps/api/src/routes/mcp.ts`、`packages/backend/src/media/og.ts`、`packages/backend/src/notify/feishu.ts`、`scripts/eval-story-digests.ts` 在全部 5 份报告中零出现。提交信息仍然写了「真实高危清零」。
2. 缺陷代码在提交前以未提交状态在工作区存在了 10 天（10-03 22:58 起启动的 web 进程一直在跑它）；基于 HEAD 的 diff 看不到它，直到这次改动被提交进来。
3. 测试和 smoke 都不覆盖 `/assets/*`：`build/client` 下只有 `assets/`，smoke 的 MACHINE 清单全是别的路径，`apps/web/tests/*.test.ts` 没有一条请求过真实构建资源。

**新增防线**：

- `apps/web/tests/client-assets.test.ts`：页面引用的样式表必须 200、`text/css`、immutable 且来自构建产物；越界路径不得被提供（含 `%2e%2e`、反斜杠和 `%5c` 变体）。
- `scripts/smoke.ts`：解析首页引用的 `/assets/*.css` 并校验 200 与 `text/css`，部署后与 CI 的 compose job 都会跑。
- 审查纪律：`inconclusive` 的运行不得作为「清零」的依据；结论必须能指出改动文件确实被扫过。

**回归验证**：

- 红/绿对照：同一构建、同一请求 `/assets/Chrome-Dog1rikW.js`，坏代码 404 `text/html`，`.\${decoded}` 修复后 200 `text/javascript`（1524 字节）。
- 线上：`/assets/root-C1g7ngOm.css` 200 `text/css`（106205 字节）；`/%2e%2e/package.json`、`/assets/%2e%2e/%2e%2e/package.json`、`%5c..%5c` 变体均 404 且无内容泄漏。
- `node scripts/smoke.ts --base http://127.0.0.1:3000`：全部通过，含 `/assets/root-C1g7ngOm.css`。

## 2026-10-13 · smoke 的新本地门禁打断 CI compose job（P1）

**发现问题**：`scripts/smoke.ts` 新增的 `LOCAL_HOSTS` 只放行 `localhost/127.0.0.1/::1`，而 `.github/workflows/check.yml` 的 compose job 用 `--base http://web:3000`（service 名）且未带 `--live`：30 项检查全 ✗、exit 1。同一提交没有更新 `.github/`。

**原审查范围**：提交 dfe5a5b。

**漏报原因**：与上一条同一次 `inconclusive` 运行；审查只看改动本身，没有反向检查脚本的所有调用方（CI、文档、部署脚本），而 `.github/` 不在 diff 里。

**新增防线**：`check.yml` 补 `--live`（提交 3a228bd）。`scripts/smoke.ts` 头部已写明非本地目标需要 `--live`。

**回归验证**：`--base http://web:3000` 不带 `--live` 时拒绝并给出提示；带 `--live` 时门禁放行（随后是网络错误，因为本机不解析 `web`）；`--base http://127.0.0.1:3000` 全部通过。
