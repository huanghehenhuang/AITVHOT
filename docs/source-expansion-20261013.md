# 2026-10-13 信源扩展

本轮新增并启用 20 个免费公开 RSS 入口。配置库从 231 增至 251，运行数据库从 249 增至 269（启用 267）。既有暂停来源保持暂停。首轮实采新增 50 条素材；这是待处理素材数，不是新增精选数。

## 来源与真实解析结果

下表为北京时间 2026-10-13 最后一次列表核验，按最终过滤规则统计；0 表示当前列表没有符合范围的近 30 天文章，保留为后续更新监测入口，不计为近期有效产出。RSS 列表长度有限，因此条目数不是网站完整 30 天发文量。

| 来源 | 订阅 | 当前匹配的近30天条目 |
|---|---|---:|
| 爱范儿 | [RSS](https://www.ifanr.com/feed) | 0 |
| 数英 | [RSS](https://www.digitaling.com/rss) | 2 |
| AI Business | [RSS](https://aibusiness.com/rss.xml) | 1 |
| SiliconANGLE | [RSS](https://siliconangle.com/feed/) | 2 |
| Tech Xplore | [RSS](https://techxplore.com/rss-feed/) | 0 |
| Tubefilter 创作者产业 | [RSS](https://www.tubefilter.com/feed/) | 1 |
| SciTechDaily AI | [RSS](https://scitechdaily.com/tag/artificial-intelligence/feed/) | 0 |
| Digiday 创作者与媒体产业 | [RSS](https://digiday.com/feed/) | 3 |
| TheWrap AI | [RSS](https://www.thewrap.com/?s=artificial+intelligence&feed=rss2) | 3 |
| MarkTechPost | [RSS](https://www.marktechpost.com/feed/) | 3 |
| AnimationXpress 动画与制作 | [RSS](https://animationxpress.com/feed/) | 3 |
| YouTube 官方博客 | [RSS](https://blog.youtube/rss/) | 3 |
| Vimeo 官方博客 | [RSS](https://vimeo.com/blog/feed/) | 3 |
| Creative Boom | [RSS](https://www.creativeboom.com/feed/) | 1 |
| Engadget | [RSS](https://www.engadget.com/rss.xml) | 0 |
| Windows Central | [RSS](https://www.windowscentral.com/feeds/all) | 0 |
| TechPowerUp | [RSS](https://www.techpowerup.com/rss/news) | 2 |
| Social Media Today | [RSS](https://www.socialmediatoday.com/feeds/news/) | 2 |
| Fast Company | [RSS](https://www.fastcompany.com/latest/rss) | 0 |
| Social Media Examiner | [RSS](https://www.socialmediaexaminer.com/feed/) | 5 |

## 采集与筛选

泛科技入口限定 AI 影视创作、图像/视频生成、语音合成、相关产品和短剧产业词；广告案例入口不再仅凭普通视频/图像词收录。影视媒体和官方创作者博客采用原有领域筛选。新规则已同步到本轮新增数据库来源，seed 仍然保留既有来源配置。

轮询每 120 分钟，最多回溯 30 天，首轮每源最多 3 条，后续采集继续按游标去重。默认只展示摘要和原文链接，全文展示与分发关闭。没有修改精选评分门槛、模型配置或预算。

## 信息量诊断

近一周原有素材每天约 95–536 条；按北京时间原始内容日期统计，可公开的全部动态每天约 11–50 条，精选每天 1–6 条。采集数、可公开文章数、去重事件数使用不同口径，不能相加或保证同比增长。原有库同时存在 15 个 failing 和 59 个 degraded 入口，包括 403、超时和公众号采集地址不可达；本轮扩展不绕过网络安全检查。

逐源证据见 [source-expansion-20261013-checks.json](source-expansion-20261013-checks.json)。复查配置：`node scripts/check-sources.ts`；预览导入：`node --env-file=.env scripts/seed.ts --dry-run`。

## 验证

251 个来源配置校验通过；重复导入预览为 0 个待新增；类型检查、Web 构建和运行站点全部冒烟检查通过。RSS 与列表解析专项测试 23/23 通过。完整独立测试 175/178 通过（外观脚本、outbound-protocol 和页面元数据失败），Web 测试 48/52 通过（视频与导航相关失败）。数据库全量测试在 Windows SIGTERM 用例超时后停滞，已终止该测试运行，不能视为全量通过。测试日志保存在工作区 `.tools/source-expansion-*.log`。
