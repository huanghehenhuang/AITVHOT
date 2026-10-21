# 2026-10-15：继续增加可用创作信源

新增并启用 **14 个来源**，修复 **7 个已有项目源**。导入前每个新入口均解析到近 30 天内容，共 68 条近期匹配。当前配置库 355 个；运行库 374 个、启用 372 个，包含其他既有和同期维护的来源。入口数量不是独立网站或平台数，其他来源配置和状态保留。

新来源实际入库 36 条，当前 35 条进入全部动态、2 条精选。处理状态：analyzed 35、new 1。包含回补，不是日均产出。更新已有源产生的历史总数单独列在运行证据，不与本轮新增混算。

## 新增来源

| 来源 | 类型 | 导入前近期匹配 | 实际入库 |
|---|---|---:|---:|
| Reddit comfyui · 创作与工作流分享 | rss | 17 | 5 |
| comfyui-simple-batch · 开源创作项目发布 | web_list | 1 | 1 |
| second-unit · 开源创作项目发布 | web_list | 1 | 1 |
| ComfyUI-Video-Control-Studio · 开源创作项目发布 | web_list | 2 | 2 |
| ComfyUI-Easy-Media · 开源创作项目发布 | web_list | 3 | 3 |
| LTX-Desktop · 开源创作项目发布 | web_list | 1 | 1 |
| mlx-audio · 开源创作项目发布 | web_list | 5 | 3 |
| ComfyUI Wiki · 工作流与开源创作分享 | web_list | 20 | 8 |
| Stable Diffusion Tutorials · 创作教程 | rss | 1 | 1 |
| ai-video-editor · 开源创作项目发布 | web_list | 1 | 1 |
| ComeCut · 开源创作项目发布 | web_list | 3 | 3 |
| director-desk · 开源创作项目发布 | web_list | 5 | 3 |
| Toonflow-app · 开源创作项目发布 | web_list | 7 | 3 |
| OpenCut · 开源创作项目发布 | web_list | 1 | 1 |

覆盖 ComfyUI 工作流与节点、AI 短剧制作、白模预演与机位调度、视频剪辑、AI 音频生成、电影后期与图像生成教程。ComfyUI Wiki 是社区知识站，按 T2 处理；Reddit 保留原帖作者、文字和发布时间，教程和项目分享进入候选后仍需通过原有内容判断，不把图片/视频链接当成已取得字幕。

## 修复已有采集入口

GitHub 匿名 API 返回 HTTP 403，响应明确为匿名额度用尽（剩余额度 0）。停止继续依赖 API 核验，改用项目官方公开 releases 页面；不增加鉴权、不开付费服务、不绕过验证。页面“released this”旁的 `relative-time[datetime]` 是发布字段，未使用提交、仓库更新时间或抓取时间。逐页读取 `.markdown-body` 获取真实发布说明，复用既有 HTML 采集能力，未修改后端解析器。

修复名单：Trendlume · 开源创作项目发布、agnes-video-generator · 开源创作项目发布、clipforge · 开源创作项目发布、openshorts · 开源创作项目发布、video-automation · 开源创作项目发布、Go-Ai-Studio · 开源创作项目发布、MoneyPrinterTurbo · 开源创作项目发布。保留来源 ID、启停状态、游标和既有文章，仅原子更新采集类型与对应配置；内部旧 ID 仍可能以 json 开头，实际 kind 已是 web_list。未新增同项目的重复入口。真实发布说明样本、原配置与新配置均保存在 checks 文件中。

每轮先按页面确认的发布日期执行 30 天上限；新项目首轮最多回补 3 条，ComfyUI Wiki 最多 8 条，RSS 教程及社区最多 5 条。后续常规采集按既有发现窗口继续；不改精选门槛、预算、模型选择或安全阀。默认只展示摘要和原文链接。

运行排查发现后台处理原启动路径指向不存在的 packages/backend/src/main.ts；复查时现有启动脚本已同步修正为 apps/worker/src/main.ts，且正确进程已启动。本轮未覆盖这项同期修复或启动第二个进程，确认现有 worker 已开始处理新素材。新增来源的 36 条素材中已有 35 条分析并公开展示，剩余 1 条按原有流程处理，未伪称全部完成筛选。

## 未导入的候选

核验了更多 ComfyUI 插件、短剧工具、音频项目与教程订阅：无 release、404/403、超时、没有近 30 天发布的入口没有导入。GitHub 仓库按项目归属与地址同时去重，例如已有 LTX-2 项目未重复导入。其他 Reddit 社区仍返回 429，只有本轮 comfyui 成功。失败和停更候选不算可用新增。

## 验证与证据

- [新增配置、近期样本、重复排除与七个修复的前后记录](source-expansion-20261015-checks.json)
- [候选完整解析结果](source-expansion-20261015-candidates.json)
- [逐源健康、处理与公开展示快照](source-expansion-20261015-runtime.json)

来源专项 24/24 通过；类型检查、Web 构建、站点/API/MCP 冒烟通过。全量测试 778 项，759 通过、19 失败；Web 测试 54 项，37 通过、17 失败，其中存在 Playwright Chromium 可执行文件缺失的运行环境问题，不声称全量绿色。启动脚本语法检查 0 个错误。测试使用独立临时数据库，外部推送关闭；Windows 上挂起的 SIGTERM 用例按名称排除，未声称覆盖。日志在工作区 `.tools/expand5-*.log`。
