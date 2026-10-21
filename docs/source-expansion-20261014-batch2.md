# 2026-10-14 第二批：国内产业媒体与官方创作更新

本轮新增并启用 **17 个入口**，归属 **15 个发布者/项目**：10 个 HTML 列表、6 个 JSON/内嵌 JSON 列表、1 个官方 RSS 更新订阅。配置库从 277 增至 294；运行数据库共 312 个来源，启用 310 个。已有来源配置和暂停状态没有被 seed 覆盖。
核验 37 个完整候选配置，并检查了其他公开主页及订阅入口。保留的每个入口都能实际解析，且有带原始日期的近 30 天领域内容；最终列表合计 50 个匹配条目，跨来源有重叠，不是日均产出。

采集累计入库 39 条；复核撤回了 9 条详情补读后确认超龄的旧文章，保留原记录供审计。最终有 30 条近 30 天素材，快照中 27 条进入可公开全部动态，6 条入选精选。首次采集含历史回补，文章与去重事件不是同一统计口径。

## 新增入口

| 来源 | 公开入口 | 近30天列表匹配 | 实采近期素材 |
|---|---|---:|---:|
| Adobe · 官方创作与影视博客 | [列表](https://blog.adobe.com/en/query-index.json?offset=14000&limit=10000) | 4 | 3 |
| 文娱商业观察 · 搜狐公开专栏 | [列表](https://m.sohu.com/media/99935850) | 1 | 1 |
| 新熵 · 搜狐公开专栏 | [列表](https://m.sohu.com/media/123977) | 2 | 2 |
| 视听指南 · 搜狐公开专栏 | [列表](https://m.sohu.com/media/697084) | 2 | 2 |
| 蓝鲸新闻 · 搜狐公开专栏 | [列表](https://m.sohu.com/media/250147) | 1 | 1 |
| 站长之家 · AI影视与短剧产业 | [列表](https://www.chinaz.com/news/) | 2 | 2 |
| AITNT · AI创作资讯 | [列表](https://www.aitntnews.com/) | 1 | 1 |
| 虎嗅 · AI影视与短剧产业 | [列表](https://www.huxiu.com/) | 1 | 1 |
| Autodesk · 官方影视与动画新闻 | [列表](https://adsknews.autodesk.com/en/) | 1 | 1 |
| FastVideo 视频模型 · 模型发布 | [列表](https://huggingface.co/api/models?author=FastVideo&sort=createdAt&direction=-1&limit=30&full=true&config=false) | 2 | 2 |
| World Labs · 官方研究与公告 | [列表](https://www.worldlabs.ai/blog) | 1 | 1 |
| 中广互联 · 短剧 | [列表](https://www.tvoao.com/TagList/?tag=%E7%9F%AD%E5%89%A7) | 15 | 3 |
| 中广互联 · 漫剧 | [列表](https://www.tvoao.com/TagList/?tag=%E6%BC%AB%E5%89%A7) | 7 | 3 |
| Synthesia · 官方博客 | [列表](https://www.synthesia.io/blog) | 6 | 3 |
| WellSaid · 官方博客 | [列表](https://www.wellsaid.io/blog) | 1 | 1 |
| Descript · 官方创作者博客 | [列表](https://www.descript.com/blog) | 1 | 1 |
| Descript · 官方产品更新 | [列表](https://descript.canny.io/api/changelog/feed.rss) | 2 | 2 |

## 原始日期与内容边界

- Adobe 公开索引的 `date` 是电子表格整日序号，新增显式 `publishedAtUnit: "excel_days"` 支持。`46288` 对应 2026-09-23，不使用 `lastModified` 充当发布日期。真实索引前后均解析 996 条，994 条日期格式改正，领域内近期匹配由 0 变成 4；历史记录仍受 30 天限制。索引从官方索引中 2023 年起的档案区开始读取，当前 996 条；设有足够分页上限用于后续增长，来源改版或索引重排时需复核。

- 原先采集器只在详情日期被标为 authoritative 时再次执行 30 天过滤；普通列表缺失日期、详情读出旧日期时会漏过。本轮 9 条超龄记录证明了该问题。现对全部详情补齐后的日期再次过滤，自动化回归覆盖首次与重复采集。旧文章通过标准后台撤回流程隐藏，原文与审计记录保留。

- WellSaid、Descript 博客和虎嗅采用已有详情日期补读机制，并设置精确的 `publishedAfter` 上线边界：只有确认发布日期的条目才能入库，未知日期或详情预算未覆盖的记录不会冒充新消息；30 天滚动上限继续有效。三个来源首轮最多 8 条，其余最多 3 条；WellSaid 每轮最多 20 次详情补读，Descript 与虎嗅最多 8 次。

- 搜狐公开作者页身份另行核对：新增专栏实际名称为文娱商业观察、新熵、视听指南、蓝鲸新闻。视听指南使用其真实名称及归属；内部来源 ID 保留最初占位名，不影响作者页面或展示。国内专栏不是公众号直连。中广互联的短剧与漫剧两个入口共享归属；Descript 博客和产品更新共享归属，不算四个独立发布者。

- Descript 官方更新订阅地址从其官方 changelog 页的 RSS 声明取得；Adobe、Autodesk、World Labs、Synthesia、WellSaid 与 Descript 标为官方来源，FastVideo 为项目自身模型发布。媒体和转载门户标为 T2 / 非一手。默认全文展示和全文分发关闭，没有修改评分门槛、模型选择与预算。

## 验证与运行证据

- [最终日期、真实样本与 Adobe 前后对比](source-expansion-20261014-batch2-checks.json)
- [完整配置候选的解析结果](source-expansion-20261014-batch2-candidates.json)
- [数据库来源健康与近期素材快照](source-expansion-20261014-batch2-runtime.json)
- [误入旧文章的撤回记录](source-expansion-20261014-batch2-withdrawals.json)

294 个配置校验通过；重复 seed 预览无新增、294 个 ID 保留、0 个别名跳过。17 个入口均启用且采集健康为 ok。日期/列表/RSS 专项 27/27、信源数据库专项 34/34 通过。类型检查、Web 构建、运行站点冒烟检查通过。Web 测试 50/54 通过，4 项视频与导航失败；全量测试 775 项中 756 通过、19 失败，涉及备份、行业夹具、页面元数据和出站协议等现有问题。已知 Windows 上无法完成的 5 个 SIGTERM 用例通过明确测试名称排除，其余用例按完整测试目录执行，不声称覆盖了退出信号测试。日志存放于工作区 `.tools/source-expansion3-*.log`。
