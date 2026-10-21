# 2026-10-14 可用信源继续扩展

本轮新增并启用 26 个入口（23 个 RSS、2 个国内公开作者专栏、1 个官方模型列表）。配置库从 251 增至 277；运行数据库共 295 个来源，其中 293 个启用。既有来源的暂停状态、过滤配置与轮询频率未被导入覆盖。
共核验 200 个候选入口；本轮保留的每个入口都通过实际列表解析，并有带日期的近 30 天领域匹配。最终列表合计 90 个匹配条目，跨来源可能重叠，不是日均产出。

启用后自动 worker 与手工验证采集合计入库 54 条素材；运行快照中 31 条进入可公开的全部动态，3 条入选精选。这些是本轮启用后短时间的快照，包含历史回补，后续仍会经过事件归组和去重。

## 入口与产出

| 来源 | 入口 | 最近匹配日期 UTC | 近30天匹配 | 本轮入库素材 |
|---|---|---|---:|---:|
| The Politics of AI Filmmaking | [公开列表](https://politicsofai.substack.com/feed) | 2026-10-08 | 8 | 3 |
| The AI Pixel | [公开列表](https://theaipixel.substack.com/feed) | 2026-10-12 | 7 | 3 |
| The New Protagonists | [公开列表](https://tarynoneill.substack.com/feed) | 2026-09-25 | 1 | 1 |
| Lab Thoughts | [公开列表](https://labthoughts.substack.com/feed) | 2026-10-06 | 1 | 1 |
| Keep It Magazine | [公开列表](https://keepitmag.substack.com/feed) | 2026-09-22 | 1 | 1 |
| Motionographer | [公开列表](https://motionographer.com/feed/) | 2026-10-07 | 1 | 1 |
| TV Technology | [公开列表](https://www.tvtechnology.com/feeds/all) | 2026-10-13 | 5 | 3 |
| TVBEurope | [公开列表](https://www.tvbeurope.com/feed) | 2026-10-12 | 3 | 3 |
| Sports Video Group | [公开列表](https://www.sportsvideo.org/feed/) | 2026-10-12 | 2 | 2 |
| Variety 产业新闻 | [公开列表](https://variety.com/feed/) | 2026-10-13 | 1 | 1 |
| ScreenVoice | [公开列表](https://www.screenvoice.cz/en/feed/) | 2026-10-08 | 3 | 3 |
| The Ankler | [公开列表](https://theankler.com/feed) | 2026-10-10 | 1 | 1 |
| 量子位 · 搜狐公开专栏 | [公开列表](https://m.sohu.com/media/610300) | 2026-10-13 | 2 | 2 |
| 机器之心Pro · 搜狐公开专栏 | [公开列表](https://m.sohu.com/media/129720) | 2026-10-13 | 2 | 2 |
| Envato 官方博客 | [公开列表](https://elements.envato.com/learn/feed) | 2026-10-02 | 1 | 1 |
| Respeecher 官方博客 | [公开列表](https://www.respeecher.com/blog/rss.xml) | 2026-10-09 | 1 | 1 |
| OpenBMB MiniCPM 多模态 · 模型发布 | [公开列表](https://huggingface.co/api/models?author=openbmb&search=MiniCPM&sort=createdAt&direction=-1&limit=30&full=true&config=false) | 2026-10-07 | 2 | 2 |
| AI Marketing for Storytellers | [公开列表](https://aimarketingforstorytellers.substack.com/feed) | 2026-10-13 | 7 | 3 |
| What’s New in Generative Media | [公开列表](https://danbgoldman.substack.com/feed) | 2026-10-13 | 18 | 3 |
| VideoWeek 广告与视频产业 | [公开列表](https://videoweek.com/feed/) | 2026-10-13 | 8 | 4 |
| PRODU 产业新闻 | [公开列表](https://www.produ.com/feed/) | 2026-10-13 | 3 | 3 |
| C21Media | [公开列表](https://www.c21media.net/feed/) | 2026-10-13 | 2 | 2 |
| WaveSpeedAI 官方博客 | [公开列表](https://wavespeed.ai/blog/rss.xml) | 2026-10-05 | 5 | 3 |
| Pictory 官方博客 | [公开列表](https://pictory.ai/feed) | 2026-09-14 | 1 | 1 |
| Futurism | [公开列表](https://futurism.com/feed) | 2026-10-09 | 3 | 3 |
| MusicTech | [公开列表](https://musictech.com/feed/) | 2026-10-12 | 1 | 1 |

## 范围与运行方式

覆盖 7 个创作者与行业简报、12 个影视/广播/视频广告/音乐行业媒体、4 个官方创作工具博客、2 个国内 AI 媒体作者专栏、1 个官方多模态模型发布列表。量子位、机器之心、Variety、VideoWeek、PRODU 等新入口与已有相同媒体共用归属；同一发布者的多个渠道不视作相互独立的佐证。

新 RSS 每 120 分钟轮询，国内专栏和模型列表每 180 分钟。保持 30 天历史限制及每源首轮最多 3 条；自动轮询和手工验证后可能继续发现新增条目。短剧范围补充 microseries、micro-series、vertical entertainment 等产业用词；泛科技来源按影视生成任务过滤。WaveSpeedAI 仅保留产品更新与相关工作流，排除工具榜单、评测比较和猜测发布日期；Envato 排除厂商对比榜单；OpenBMB 仅纳入 MiniCPM-V / MiniCPM-o 多模态模型并过滤量化与平台变体。

官方工具博客标注为 T1 / first_party；媒体及作者简报标注为 T2 / 非一手。搜狐入口读取公开作者列表，不是公众号直连。Substack 读取公开订阅内容，不绕过付费墙。评分门槛、模型选择和预算未调整；全文展示及全文分发关闭。

## 核验记录

- [逐源最终解析、日期与样本](source-expansion-20261014-checks.json)
- [全部候选的可达性与匹配结果](source-expansion-20261014-candidates.json)
- [运行数据库、采集健康与处理状态快照](source-expansion-20261014-runtime.json)

候选中空列表、报错、只有旧文章、没有近期领域匹配或与既有列表重复的入口均未作为新增可用来源启用。泛 AI 营销、普通硬件、健康设备和一般编程资料也未计入本轮来源。免费列表采集仍可能产生后续模型处理费用，由现有预算熔断和回执约束。

## 验证

277 个来源配置检查通过；导入后重复预览为 0 个待新增，277 个既有 ID 保留，0 个地址别名跳过。新增来源 26/26 已启用，实际采集健康全部为 ok。类型检查、Web 构建与运行站点全部冒烟检查通过；RSS/列表解析专项测试 23/23 通过。Web 测试 50/54 通过，4 个失败涉及视频和导航；全量数据库测试在 Windows SIGTERM 用例超时后停止推进，已终止，不能视为通过。信源数据库专项测试 30/30 通过，覆盖来源规则、导入判重与幂等、日期窗口、主题过滤、健康状态、外部文章身份及 JSON 列表。日志存放在工作区 `.tools/source-expansion2-*.log`。

