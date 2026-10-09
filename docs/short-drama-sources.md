# 短剧与漫剧信源扩展

2026-10-09 在 162 个入口基础上新增 **35 个**，现共 **197 个**；另外扩展 8 个既有影视媒体的短剧主题过滤。新增包括 11 个 RSS、11 个 HTML 列表、13 个公开页面内嵌 JSON，全部直接读取公开列表，不使用 X、公众号付费 API 或 Jina。

仓库采集器从本轮新源捕获的响应中解析出 566 个条目，按配置范围保留 219 个，其中 74 个在验证时属于近 30 天，分布在 22 个入口；其余 13 个目前只有较旧匹配记录，作为新发布监测入口。全部匹配条目有可解析日期。这些统计尚未跨来源、网址、正文或事件去重，不是日均增量，也不是精选数量。

| 类别 | 新增入口数 |
|---|---:|
| 国内行业媒体与研究 | 16 |
| 平台与制作发行公司 | 6 |
| 监管公告 | 3 |
| 海外竖屏剧媒体与简报 | 10 |

## 公开来源与日期口径

12 个国内媒体入口读取其搜狐公开作者专栏上的 `blockRenderData`，提取标题、摘要、文章链接和 `postTime`，不执行 JavaScript、无需登录或私有账号。它们是平台专栏，不能视为公众号直连；平台发布日可能晚于原公众号或官网首发日。短剧自习室官网与其专栏、DataEye 报告与其专栏共用原媒体归属，仍按正文和事件去重。旧版骨朵专栏停留在 2021 年、新腕儿旧专栏停留在 2024 年的结果没有加入。

新腕儿首页本身不含可采集文章链接；使用其页面实际调用的公开、只读表单列表，提交页码和页大小，以文章 ID 生成原文链接，并读取条目中原始完整发布时间。广电总局读取公告列表中 XML CDATA 的 HTML 条目。中文在线卡片读取 `data-link` 与页面日期；不以图片上传日或抓取时间补发布日期。

ReelShort 母公司和阅文的列表链接包含外部媒体报道；HOLYWATER 列表也混有公司与媒体内容，这三者标为 `first_party: false`、T1_5。广东行业动态中包含转载，按 T1_5；官方原始公告与公司新闻按其真实来源分级。所有来源默认关闭全文展示及全文分发。

Vertical Drama 与 Streaming Radar 共用归属。前者只收 `/news/` 路径，排除每周作品排行，防止把榜单页当新增产业新闻。HOLYWATER 当前没有日期的卡片不采集。当前没有近 30 天记录的报告及政策入口继续监测，30 天历史窗口阻止其旧记录回灌。

表中最近匹配日期按 UTC 展示；逐条时间带时区，国内凌晨发布可能对应前一 UTC 日。原始响应哈希、请求方式、来源网址及逐源核验时间见 [source-checks.json](source-checks.json)。

## 国内行业媒体与研究（16）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| DataEye 微短剧与漫剧公开报告<br>`web-dataeye-reports` | [列表](https://www.dataeye.com/media-center.html) | T1 | 2026-08-02 | 0 |
| 短剧自习室 · 文章<br>`web-duanju007-posts` | [列表](https://duanju007.com/posts) | T2 | 2026-10-02 | 7 |
| 新腕儿 · 短剧与漫剧行业报道<br>`web-xinwanr` | [列表](https://www.xinwanr.com/news_list_index) | T2 | 2026-09-30 | 1 |
| 传媒内参 · 搜狐公开专栏<br>`json-sohu-chuanmeineican` | [列表](https://m.sohu.com/media/351788) | T2 | 2026-10-08 | 7 |
| 短剧自习室 · 搜狐公开专栏<br>`json-sohu-duanju007` | [列表](https://m.sohu.com/media/121864780) | T2 | 2026-10-08 | 8 |
| DataEye数据 · 搜狐公开专栏<br>`json-sohu-dataeye` | [列表](https://m.sohu.com/media/120362942) | T2 | 2026-10-09 | 6 |
| 毒眸 · 搜狐公开专栏<br>`json-sohu-dumou` | [列表](https://m.sohu.com/media/100240657) | T2 | 2026-10-08 | 4 |
| 娱乐资本论 · 搜狐公开专栏<br>`json-sohu-entcapital` | [列表](https://m.sohu.com/media/159592) | T2 | 2026-10-08 | 4 |
| 壹娱观察 · 搜狐公开专栏<br>`json-sohu-yiyu` | [列表](https://m.sohu.com/media/477902) | T2 | 2026-10-02 | 4 |
| 深响 · 搜狐公开专栏<br>`json-sohu-shenxiang` | [列表](https://m.sohu.com/media/100194960) | T2 | 2026-09-28 | 1 |
| 娱乐独角兽 · 搜狐公开专栏<br>`json-sohu-entunicorn` | [列表](https://m.sohu.com/media/549401) | T2 | 2026-09-30 | 1 |
| 新榜 · 短剧与 AI 内容行业报道<br>`json-newrank-news` | [列表](https://www.newrank.cn/article) | T2 | 2026-09-30 | 2 |
| 影视独舌 · 搜狐公开专栏<br>`json-sohu-yingshidushe` | [列表](https://m.sohu.com/media/116162) | T2 | 2026-10-08 | 2 |
| 镜像娱乐 · 搜狐公开专栏<br>`json-sohu-jingxiang` | [列表](https://m.sohu.com/media/305277) | T2 | 2026-09-29 | 1 |
| 读娱官网 · 搜狐公开专栏<br>`json-sohu-duyu` | [列表](https://m.sohu.com/media/523234) | T2 | 2026-09-30 | 1 |
| 编剧帮 · 搜狐公开专栏<br>`json-sohu-bianjubang` | [列表](https://m.sohu.com/media/154166) | T2 | 2026-07-31 | 0 |

## 平台与制作发行公司（6）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 快手 · 公司公告与 AI 内容业务<br>`rss-kuaishou-company-news` | [列表](https://ir.kuaishou.com/rss/news-releases.xml) | T1 | 2026-07-21 | 0 |
| 爱奇艺 · 官方新闻与 AI 制作<br>`rss-iqiyi-company-news` | [列表](https://ir.iqiyi.com/rss/news-releases.xml) | T1 | 2026-09-23 | 1 |
| 中文在线 · 官方新闻<br>`web-col-news` | [列表](https://www.col.com/list-e6jni41m/guanfangxinwen/2/10) | T1 | 2026-07-29 | 0 |
| Crazy Maple Studio / ReelShort · 媒体报道<br>`web-crazy-maple-news` | [列表](https://crazymaplestudios.com/maple-news) | T1_5 | 2026-08-27 | 0 |
| 阅文集团 · 媒体报道<br>`web-yuewen-news` | [列表](https://www.yuewen.com/news) | T1_5 | 2026-08-10 | 0 |
| HOLYWATER TECH / My Drama · 公开新闻<br>`web-holywater-news` | [列表](https://www.holywater.tech/blog) | T1_5 | 2026-09-02 | 0 |

## 监管公告（3）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 国家广电总局 · 公告公示<br>`web-nrta-notices` | [列表](https://www.nrta.gov.cn/col/col113/index.html) | T1 | 2026-09-30 | 1 |
| 广东省广电局 · 通知公告<br>`web-guangdong-notices` | [列表](https://gbdsj.gd.gov.cn/zxzx/tzgg/) | T1 | 2026-06-10 | 0 |
| 广东省广电局 · 行业动态<br>`web-guangdong-industry` | [列表](https://gbdsj.gd.gov.cn/zxzx/hydt/) | T1_5 | 2026-10-04 | 3 |

## 海外竖屏剧媒体与简报（10）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| The Hollywood Reporter · 微短剧<br>`rss-hollywood-microdramas` | [列表](https://www.hollywoodreporter.com/t/microdramas/feed/) | T2 | 2026-07-24 | 0 |
| Variety · 微短剧<br>`rss-variety-microdramas` | [列表](https://variety.com/t/microdramas/feed/) | T2 | 2026-09-29 | 2 |
| Deadline · 微短剧<br>`rss-deadline-microdramas` | [列表](https://deadline.com/tag/microdramas/feed/) | T2 | 2026-07-23 | 0 |
| Streaming Radar · 竖屏剧产业简报<br>`rss-streaming-radar` | [列表](https://www.streaming-radar.com/feed) | T2 | 2026-10-08 | 5 |
| Vertical Drama · 竖屏剧行业新闻<br>`rss-verticaldrama-news` | [列表](https://www.verticaldrama.tv/feed.xml) | T2 | 2026-10-08 | 5 |
| World Screen · 微短剧<br>`rss-worldscreen-microdramas` | [列表](https://worldscreen.com/?s=microdrama&feed=rss2) | T2 | 2026-03-05 | 0 |
| VideoWeek · 微短剧<br>`rss-videoweek-microdramas` | [列表](https://videoweek.com/?s=microdrama&feed=rss2) | T2 | 2026-05-08 | 0 |
| Advanced Television · 微短剧<br>`rss-advancedtv-microdramas` | [列表](https://advanced-television.com/?s=microdrama&feed=rss2) | T2 | 2026-09-07 | 0 |
| Tubefilter · 微短剧<br>`rss-tubefilter-microdramas` | [列表](https://www.tubefilter.com/?s=microdrama&feed=rss2) | T2 | 2026-09-24 | 2 |
| Vertical Story Fest · 竖屏剧行业简报<br>`web-vertical-story` | [列表](https://verticalstoryfest.com/) | T2 | 2026-10-08 | 6 |

## 过滤与成本边界

泛影视列表在详情抓取和模型处理之前，按 AI 创作或微短剧/漫剧/竖屏剧关键词限范围；普通剧情介绍、演员八卦、追剧推荐不因出现短剧或平台名而成为产业信息。监管、平台分账、保底、流量入口、扶持与准入、制作发行、版权合作、经营和市场研究可通过相关性预筛，即使没有 AI 参与。通用 AI 与纯时政的过滤边界保持。相关性通过之后仍走原有评分、去重与归组。

本轮给 No Film School、Cartoon Brew、80 Level、Animation Magazine、ProVideo Coalition、Videomaker、Filmmaker Magazine、Filmmakers Academy 增加短剧产业关键词。这 8 个仍是原入口，不重复计入新增。

每个新增入口限制 30 天有日期历史、首轮最多 3 条，媒体约 3 小时轮询，低频报告和公告每 6–12 小时；同一媒体、公司、平台的多个入口共用归属。公开列表读取没有按次付费服务费用，但服务器、正文处理、精选、向量、归组和写作仍可能产生费用。没有调低评分门槛或调整模型预算。

## 尚未接入的候选

| 候选 | 本次结果 |
|---|---|
| 红果 / 抖音短剧创作者中心 | 官网身份可确认，公开首页未解析到带日期的公告列表；不将登录后台计为已接入 |
| 九州文化 / ShortMax | 当前官网请求返回错误，保留候选，未计数 |
| 点众官网静态新闻页 | 当前静态样例主要停留在 2021 年；不以公司首页或产品目录当新闻信源 |
| 骨朵旧搜狐专栏、新腕儿旧搜狐专栏 | 匹配记录停留在 2021 / 2024 年，未加入 |
| 北京公告与政策列表、华策列表、QuestMobile 当前列表 | 本次未从标题范围解析出短剧匹配；未新增这些入口 |
| 部分微短剧标签 RSS | 返回空订阅、错误页或没有匹配，未计数；同一媒体多个重叠查询只保留一个有效入口 |
| 同名短剧平台网站 | 来源身份缺乏依据，不作为平台官方信源 |

## 导入与验证

导入方法见 [source-operations.md](source-operations.md)。seed 只新增，保留已有来源 ID、手工配置、暂停状态，并跳过同类地址别名；如需将 8 个旧源应用新过滤规则，应在后台核对配置后更新，seed 不会自动覆盖。

验证使用公开 HTTP 捕获和仓库实际 RSS/HTML/JSON 解析器，不写数据库、不抓正文、不调用模型；自动测试用本地样本。JSON 专栏使用固定公开页面结构，页面改版时可能需要更新字段路径。新增源的生产稳定性、实际日增量与精选成本需在导入启用后，通过后台来源产出和回执统计观察。
