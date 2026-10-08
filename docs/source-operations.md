# 扩大覆盖与核对成本

采集免费不等于处理免费：RSS、普通网页和 GitHub 发布订阅不需要按次付费的采集 API，但进入精选、写作和事件归组后仍可能调用模型。先补充一手与垂直信源，再按产出和回执决定哪些付费入口值得保留。

## 已验证的新增免费入口

2026-10-08 用公开 HTTP 响应验证了下面 11 个入口，并加入 `industry/sources.json`。基础配置从 12 个增至 23 个（22 个 RSS/Atom、1 个普通 HTML 列表）；这些数字不包含仅存在于线上数据库里的 X、公众号或手工添加的其他来源。

| 信源 | 入口 | 主要覆盖 |
|---|---|---|
| Comfy 官方博客 | <https://blog.comfy.org/feed> | 工作流、模型接入、创作案例 |
| fal 官方博客 | <https://blog.fal.ai/rss/> | 视频、图像、生产工作流 |
| Stability AI 官方新闻 | <https://stability.ai/news-updates?format=rss> | 图像、音频、影视合作 |
| ElevenLabs | <https://elevenlabs.io/blog/rss.xml> | 配音、声音、音频研究 |
| Replicate 官方博客 | <https://replicate.com/blog/rss> | 模型使用与创作案例 |
| LTX-2 官方发布 | <https://github.com/Lightricks/LTX-2/releases.atom> | 开源音视频模型 |
| Diffusers 官方发布 | <https://github.com/huggingface/diffusers/releases.atom> | 开源管线，先作热度证据 |
| InvokeAI 官方发布 | <https://github.com/invoke-ai/InvokeAI/releases.atom> | 图像创作与工作流 |
| Fish Speech 官方发布 | <https://github.com/fishaudio/fish-speech/releases.atom> | 开源配音模型 |
| No Film School | <https://nofilmschool.com/feeds/content-types/article.rss> | 影视创作、AI 配音与版权 |
| Black Forest Labs 官方博客 | <https://bfl.ai/blog> | 图像与视频模型 |

全部订阅返回了非空、可解析的 RSS/Atom；Black Forest Labs 的原始 HTML 用配置中的选择器可解析出 10 篇文章，标题和 `time[datetime]` 都能读取，不需要浏览器渲染或 Jina。这里验证的是列表接入，不保证每篇原文都能提取正文，也不保证未来接口一直有效。

ElevenLabs 排除 `Resources` 类，保留产品、研究、公司、客户故事和影响案例，减少通用客服与企业知识文章。No Film School 的电影与摄影内容较宽，仍按现有 AI 影视预筛处理，观察一周后的有效产出再决定是否缩窄入口。Replicate 与 Fish Speech 当前更新较慢，作为低频补充；未加入没有发布条目的 Wan2.2 Releases，以及只返回 2024 年旧发布的 HunyuanVideo Releases。

新增信源首轮最多回灌 3 条，并配置 `maxItemAgeDays: 30`：每轮都在详情补齐和模型处理前跳过已有明确日期的 30 天前旧文，避免下一轮再补进订阅里的大量存量。没有可用发布时间的条目继续保留；已有信源未配置这一字段时保持原采集范围。默认只展示摘要与原文链接，站内全文和全文分发均关闭。此次没有修改评分门槛、模型选择或付费服务预算。

## 在已有站点导入

部署包含这些配置的版本后，在后端运行环境执行：

```bash
node --env-file-if-exists=.env scripts/seed.ts
```

`seed` 只添加不存在的信源 ID，保留现有信源的后台编辑、启停与频率；它不会删除已从 JSON 移除的旧信源。同一个入口如果已经以另一 ID 加入后台，应先核对，避免重复配置。执行 seed 后，新启用来源会按 worker 的开关和计划进入采集；如只想审阅配置，先保持采集和模型开关关闭。

## 后台「产出与成本」

从「信源」页进入，或打开 `/admin/sources/efficiency`，可查看近 7 天或 30 天：

- 各信源新增条目、当前可公开的精选文章、贡献的精选事件与待归组文章。
- 按来源归属的采集费用和模型费用；实际金额与估算金额分开显示。
- 每次付费请求的次数，包括重试；同一回执复用不会重复计费。
- 金额缺失的请求数，不将它们当作免费。
- 共用及无法归属的费用，包括 X 账号合并搜索、事件综述与日报。这些费用已包含在顶部总额。

接口为管理员专用的 `GET /api/admin/sources/efficiency?days=7`（或 `30`），沿用后台会话认证，不属于公开 API。

事件按当前事件归属统计：一个来源同一事件的多篇报道只计一次，多个来源可以贡献同一个事件，因此各行事件数不能相加。顶部总数跨来源去重。未归组的精选文章单独列出，不假装已经成为事件；已撤回、不符合公开池条件、仅作信号、隔离或尚未到公开时间的文章不算精选产出。

产出窗口按首次发现时间，包含新源初次导入的历史条目；费用窗口按实际请求时间，也可能处理早于窗口发现的文章。因此这个页面用于观察覆盖与花费，不应直接将窗口总费用除以新增事件数，当成严格的每事件成本或某一来源的完整成本。

## 模型金额与单价

已有模型回执常只有 token 用量、没有金额。页面优先使用每次请求已经记录的费用；缺少金额时，使用 `service_prices` 中该服务和模型的单价估算（缺少精确模型行时，使用该服务 `model=''` 的默认行）。

单价由运营者按自己的模型接口与合同维护，单位为每百万 token；`input_per_mtok`、`output_per_mtok`、`cached_per_mtok` 分别对应普通输入、输出和缓存命中输入，`currency` 保持原币种。可以同时填写 `source_url`、`verified_on` 记录核价依据。不能用模型榜里其他厂商的价格代替当前接口单价。

估算识别 OpenAI 兼容的输入/输出用量、缓存字段，以及 DeepSeek 的缓存命中字段；向量调用使用输入 token 用量。缺少缓存单价时按普通输入单价估算，可能偏高。缺失单价、缺失或异常用量、结果未知的请求保留为「金额缺失」。历史用量用当前单价重算，只是估算，仍需和账单核对。

金额按 CNY、USD 等原币种分开展示，不自动换汇。免费采集的带宽和服务器固定费用不包含在本页。

SocialData 搜索按返回的帖子估算；按其[价格与 Fair-use 说明](https://docs.socialdata.tools/getting-started/pricing/)，空搜索是否计费还取决于账号级免费额度。成功但空的搜索会保留请求与用量，将金额标为缺失；无法从单次响应确定是否收费，不再记录成零费用。已存的旧零费用回执不会被改写，仍需与提供方账单核对。
