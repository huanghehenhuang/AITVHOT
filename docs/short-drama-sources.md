# 短剧与漫剧信源扩展

2026-10-09 继续新增 **13 个**公开入口，总库 **218 → 231**；三轮短剧专题累计新增 **69 个**，另扩展 8 个既有影视媒体的主题范围。本轮为 2 个 RSS、8 个 HTML 列表、3 个公开 JSON 或页面内嵌 JSON。

仓库采集器从本轮响应解析出 **575** 个条目，按主题和网址范围保留 **293** 个，全部有可解析发布日期；其中 **84** 个在验证时属于近 30 天，分布在 **11** 个入口。四川公告和行业动态只有较旧匹配，作为新发布监测，超龄条目仍受 30 天窗口限制。这些是未经跨来源、网址、正文和事件去重的列表快照，不是日均增量或精选入选量。

## 本轮平台、行业媒体与投放研究（7）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 影视产业观察 · 搜狐公开专栏<br>`json-sohu-yingshichanye` | [列表](https://m.sohu.com/media/100097343) | T2 | 2026-10-02 | 1 |
| Open Gardens · 竖屏剧简报<br>`rss-opengardens-vertical` | [列表](https://www.enteropengardens.com/feed) | T2 | 2026-10-09 | 5 |
| SocialPeta · 微短剧投放研究<br>`web-socialpeta-blog` | [列表](https://socialpeta.com/en/blog) | T1_5 | 2026-09-30 | 4 |
| AppGrowing · 短剧投放研究<br>`rss-appgrowing-cn-feed` | [列表](https://appgrowing.net/blog/feed/) | T1_5 | 2026-09-24 | 1 |
| 番茄小说 · 短剧漫剧改编公告<br>`json-fanqie-author-notices` | [列表](https://fanqienovel.com/writer/zone/notice) | T1 | 2026-09-29 | 3 |
| Vertical Observer · 竖屏剧产业报道<br>`json-vertical-observer-news` | [列表](https://verticalobserver.com/data/site.json) | T2 | 2026-10-08 | 61 |
| Plot Party · 微短剧产业周报<br>`web-plotparty-news` | [列表](https://plotparty.ai/page/news) | T2 | 2026-10-05 | 4 |

## 本轮地方公告与行业消息（6）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 湖南省广电局 · 通知公告<br>`web-hunan-notices` | [列表](https://gbdsj.hunan.gov.cn/gbdsj/xxgk/tzgg/newxxgklist_nochn.html) | T1 | 2026-09-22 | 1 |
| 四川省广电局 · 公告公示<br>`web-sichuan-notices` | [列表](https://gdj.sc.gov.cn/scgdj/gggs/zfxxgklist.shtml) | T1 | 2026-06-05 | 0 |
| 四川省广电局 · 行业动态<br>`web-sichuan-industry` | [列表](https://gdj.sc.gov.cn/scgdj/gdxw/list.shtml) | T1_5 | 2026-08-11 | 0 |
| 辽宁省广电局 · 通知公告<br>`web-liaoning-notices` | [列表](https://gdj.ln.gov.cn/gdj/index/tzgg/index.shtml) | T1 | 2026-09-24 | 2 |
| 辽宁省广电局 · 行业动态<br>`web-liaoning-industry` | [列表](https://gdj.ln.gov.cn/gdj/index/xydt/index.shtml) | T1_5 | 2026-09-28 | 1 |
| 湖南省广电局 · 省局与行业消息<br>`web-hunan-industry` | [列表](https://gbdsj.hunan.gov.cn/gbdsj/) | T1_5 | 2026-10-09 | 1 |

## 本轮解析与日期口径

- 番茄小说读取公开作者公告页的 `_ROUTER_DATA`，按原始秒级 `notice_time` 取发布时间。标题与公告摘要共同限定短剧、漫剧改编范围，当前匹配包含「IP 回响计划」「千字万金」及「IP 金品共创计划」。链接使用原始字符串 `url`，避免大整数 `notice_id` 的 JavaScript 精度损失；归属沿用 `bytedance`，不增加独立厂商热度。
- Vertical Observer 从官网脚本明示的公开 `data/site.json` 读取已公开的 `stories`，按原始 `date` 取日期。其报道按 T2 二手行业信息处理，引述保留来源属性；公开 JSON 已附正文，使用 `summaryIsBody` 直接作为处理材料，避免另抓只有脚本的动态页面，全文展示和分发仍关闭。225 条列表记录中 61 条在本次核验时属于近 30 天。文章通过 `#/news/ID` 路由展示，因此为 `json_list` 放行采集器已有的 `preserveUrlFragment` 配置，并验证不同报道不会折叠成首页、重复采集不会创建新版本。未开启该项的普通锚点仍按原规则合并。
- SocialPeta 和 AppGrowing 读取广告研究公司的公开博客与 RSS，按 T1_5、`first_party: true` 标记其自身研究发布，不将广告素材或投放榜单等同于实际播放量或独立市场统计。SocialPeta 的英文日期没有原始时区，配置 UTC 午夜只用于保留原始日历日期，不声称有精确发布时间。
- Open Gardens 保留微短剧关键词和专门栏目名称 `Vertical Bloom`。影视产业观察核对搜狐作者名称与 ID，再按公开 `postTime` 取平台发布时间；当前匹配为 AI 影视制作报道，平台日期可能晚于原始首发日。
- Plot Party 专门刊载微短剧行业周报，只读取列表前 5 期。列表的 `Week of ...` 是报道覆盖区间，不作为发布日期；用每期原始 JSON-LD `datePublished` 和描述元数据补齐。最多 5 次公开详情请求，12 小时轮询，不配置付费转发；5 次元数据响应的日期、HTTP 状态和 SHA-256 另列在逐源记录的 `detailChecks`。本次元数据核验不提取正文。
- 湖南读取官网实际指向的通知列表及首页有明确日期的省局、行业消息，避开返回旧档案的普通栏目地址。辽宁公告和行业动态均按列表日期读取，例如文章 URL 路径为 9 月 30 日而列表标注 9 月 28 日时保留后者。四川两类列表、湖南两类、辽宁两类各自共用部门 `owner_entity_id`；可能含转载的行业消息按 T1_5、`first_party: false` 处理。

`node scripts/check-sources.ts --live` 只验证公开列表，不读取详情；因此 Plot Party 的这条命令会显示 0 个列表日期，本次 5 个真实发布日期由上述独立元数据核验补齐。抓取时间、周报覆盖区间、图片和 URL 路径日期均未代替发布日期。

## 本轮候选核验与成本

Peacock 普通博客列表、OTT.X、StarRae RSS 当前未解析到符合范围的条目，多个新查阅的搜狐专栏也没有近期可用匹配，未计入扩容。部分地方站点返回错误或空列表，也未加入。快照没有匹配不表示发布者停止更新。

新增入口继续限制 30 天历史、首轮最多 3 条，关闭全文展示与分发；公开入口采集无需按次付费 API。Plot Party 额外需要有上限的公开元数据请求；后续正文处理、精选、写作、向量和归组仍可能收费，评分权重、门槛和预算未改变。来源配置、原始响应摘要和时间戳见 [source-checks.json](source-checks.json)，导入预览见 [source-operations.md](source-operations.md)。本轮不改变线上数据库配置或启用生产采集。

## 第二轮新增 21 个（197 → 218）

2026-10-09 继续新增 **21 个**公开入口，总库 **197 → 218**；两轮短剧专题累计新增 **56 个**，另扩展 8 个既有影视媒体的主题范围。该轮为 7 个 RSS、9 个 HTML 列表、5 个公开页面内嵌 JSON，全部直接读取公开列表。

仓库采集器从该轮响应解析出 **1859** 个条目，按主题和网址范围保留 **166** 个，全部有可解析发布日期；其中 **64** 个在验证时属于近 30 天，分布在 **19** 个入口。江苏通知公告、Morketing 出海卡片只有较旧匹配，作为新发布监测。大部分原始条目来自政府列表的历史档案，不是日均增量。统计尚未跨来源、网址、正文和事件去重，也不是精选入选量。

| 该轮类别 | 新增入口数 |
|---|---:|
| 国内行业媒体与出海研究 | 6 |
| 监管公告与地方行业工作 | 8 |
| 海外制作、发行、营销与研究 | 7 |

## 该轮来源与日期口径

5 个国内媒体入口读取经名称核对的搜狐公开作者专栏 `blockRenderData`，按原始 `postTime` 获取平台发布时间；不执行网页脚本，无需私有账号。它们不是公众号直连，平台日期可能晚于首发日。

政府列表按页面原始完整日期读取，不把 URL 路径日、抓取时间或图片上传日当作发布日期。例如福建稿件的链接路径可能为 9 月 30 日，列表日期为 9 月 25 日，采集保留列表日期。福建列表中的外链公众号文章该轮不采集。广电总局读取选定 XML CDATA，江苏读取日期明确的新闻卡片。

上海列表、福建媒体报道、江苏通知公告含外部转载，标为 T1_5、`first_party: false`；原始部门公告与工作列表按实际来源标记。江苏两类列表共用 `jiangsu-gdj`，福建三类共用 `fujian-gdj`，广电总局工作与公告共用 `nrta`。陕西行业动态与已接入要闻有重叠，该轮只保留要闻入口。AnimationXpress 两种查询也有重叠，只保留一个。

Behind the Verticals 是竖屏叙事制作简报，其公开 RSS 标题可能没有“microdrama”，因此按这个专门出版物的范围采集；其他泛媒体保留主题关键词限制。TheWrap 另排除 Daily Show、Kimmel、Colbert 等政治娱乐评论标题。Applabs 为广告技术公司，按 T2 行业研究处理，不当作独立市场统计或平台公告。PRODU 含西语行业报道，沿用微短剧关键词及后续相关性、评分流程。

下表最近匹配日期为 UTC，逐条核验时区与响应 SHA-256 见 [source-checks.json](source-checks.json)。

## 该轮国内行业媒体与出海研究（6）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 娱乐硬糖 · 搜狐公开专栏<br>`json-sohu-yingtang` | [列表](https://m.sohu.com/media/482286) | T2 | 2026-10-09 | 1 |
| 文娱价值官 · 搜狐公开专栏<br>`json-sohu-wenyu-value` | [列表](https://m.sohu.com/media/99997725) | T2 | 2026-10-08 | 6 |
| Tech星球 · 搜狐公开专栏<br>`json-sohu-techplanet` | [列表](https://m.sohu.com/media/120073179) | T2 | 2026-10-07 | 1 |
| 东西文娱 · 搜狐公开专栏<br>`json-sohu-dongxi` | [列表](https://m.sohu.com/media/100180909) | T2 | 2026-09-18 | 1 |
| 短剧内行人 · 搜狐公开专栏<br>`json-sohu-neihang` | [列表](https://m.sohu.com/media/122642385) | T2 | 2026-10-08 | 16 |
| Morketing · 出海商业洞察<br>`web-morketing-outbound` | [列表](https://www.morketing.com/) | T2 | 2026-09-01 | 0 |

## 该轮监管公告与地方行业工作（8）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 国家广电总局 · 工作动态<br>`web-nrta-industry` | [列表](https://www.nrta.gov.cn/col/col114/index.html) | T1 | 2026-09-30 | 3 |
| 上海文旅局 · 广播电视<br>`web-shanghai-tv` | [列表](https://whlyj.sh.gov.cn/gbds/index.html) | T1_5 | 2026-09-30 | 3 |
| 江苏省广电局 · 省局动态<br>`web-jiangsu-industry` | [列表](https://jsgd.jiangsu.gov.cn/col/col69981/index.html) | T1 | 2026-09-24 | 2 |
| 江苏省广电局 · 通知公告<br>`web-jiangsu-notices` | [列表](https://jsgd.jiangsu.gov.cn/col/col91594/index.html) | T1_5 | 2026-05-29 | 0 |
| 福建省广电局 · 通知公告<br>`web-fujian-notices` | [列表](https://gdj.fujian.gov.cn/gkai/tzgg/) | T1 | 2026-09-20 | 1 |
| 福建省广电局 · 省局工作<br>`web-fujian-work` | [列表](https://gdj.fujian.gov.cn/xw/sjgz/) | T1 | 2026-09-29 | 2 |
| 福建省广电局 · 媒体报道<br>`web-fujian-industry` | [列表](https://gdj.fujian.gov.cn/xw/hydt/) | T1_5 | 2026-09-29 | 2 |
| 陕西省广电局 · 省局要闻<br>`web-shaanxi-work` | [列表](https://gdj.shaanxi.gov.cn/xwzx/bmdt/sjyw/) | T1 | 2026-09-30 | 6 |

## 该轮海外制作、发行、营销与研究（7）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| Behind the Verticals · 竖屏剧制作简报<br>`rss-behind-verticals` | [列表](https://www.behindtheverticals.com/feed) | T2 | 2026-10-06 | 4 |
| Digiday · 微短剧营销与商业<br>`rss-digiday-microdramas` | [列表](https://digiday.com/?s=microdrama&feed=rss2) | T2 | 2026-09-23 | 1 |
| AnimationXpress · 微短剧产业<br>`rss-animationxpress-microdramas` | [列表](https://animationxpress.com/?s=microdrama&feed=rss2) | T2 | 2026-09-29 | 1 |
| TodoTV News · 微短剧产业<br>`rss-todotv-microdramas` | [列表](https://todotvnews.com/en/?s=microdrama&feed=rss2) | T2 | 2026-09-29 | 1 |
| PRODU · 微短剧产业<br>`rss-produ-microdramas` | [列表](https://www.produ.com/?s=microdrama&feed=rss2) | T2 | 2026-10-08 | 9 |
| TheWrap · 微短剧产业<br>`rss-thewrap-microdramas` | [列表](https://www.thewrap.com/?s=microdrama&feed=rss2) | T2 | 2026-10-02 | 3 |
| Applabs · 微短剧移动广告研究<br>`rss-applabs-microdramas` | [列表](https://blog.applabs.ai/feed/) | T2 | 2026-09-09 | 1 |

## 该轮候选核验与成本

| 未接入候选 | 该轮结果 |
|---|---|
| 三声、网视互联的旧搜狐专栏 | 匹配记录主要停留在 2021 / 2022 年，未加入；不代表其他发布渠道停更 |
| 犀牛娱乐、刺猬公社、霞光社、钛媒体、蓝鲸新闻等当前专栏 | 当前公开列表没有主题匹配，保留候选；不推断媒体停更 |
| Adweek、Marketing Brew、TV Technology、FOX 业务 RSS | 能读取列表，但本次快照没有短剧匹配，未计入新增 |
| CNSA、河南列表、Señal 标签与 AppsFlyer RSS | 当前请求失败，未计入新增 |
| Shorts Report、Vertical Series Network、部分短剧网站 | 没有可用的条目原始完整日期，未以网页更新时间、聚合发现时间补日期 |
| 浙江该轮两个列表 | 当前响应未解析出带日期的短剧条目，未计入新增 |

该轮继续限制 30 天有日期历史、首轮最多 3 条，媒体通常每 3 小时，公告和海外简报每 6 小时，Morketing 出海卡片每 12 小时。没有新增按次付费采集 API，全文展示和分发均关闭。服务器、正文处理和后续模型仍可能产生费用，评分门槛、模型选择及预算不变。

该轮仅更新来源配置与文档，复用仓库已有采集器。验证读取公开列表快照，不入库、不抓正文、不调用模型；没有扩大八卦、剧情推荐或泛 AI 的相关性范围。导入方法见 [source-operations.md](source-operations.md)，seed 继续保留已有来源、暂停状态和手工配置。生产稳定性与实际日增量需在启用后通过后台产出与回执核对。

## 首轮新增 35 个（162 → 197）

2026-10-09 上轮在 162 个入口基础上新增 **35 个**，当时共 **197 个**；另外扩展 8 个既有影视媒体的短剧主题过滤。新增包括 11 个 RSS、11 个 HTML 列表、13 个公开页面内嵌 JSON，全部直接读取公开列表，不使用 X、公众号付费 API 或 Jina。

仓库采集器从该轮新源捕获的响应中解析出 566 个条目，按配置范围保留 219 个，其中 74 个在验证时属于近 30 天，分布在 22 个入口；其余 13 个目前只有较旧匹配记录，作为新发布监测入口。全部匹配条目有可解析日期。这些统计尚未跨来源、网址、正文或事件去重，不是日均增量，也不是精选数量。

| 类别 | 新增入口数 |
|---|---:|
| 国内行业媒体与研究 | 16 |
| 平台与制作发行公司 | 6 |
| 监管公告 | 3 |
| 海外竖屏剧媒体与简报 | 10 |

### 公开来源与日期口径

12 个国内媒体入口读取其搜狐公开作者专栏上的 `blockRenderData`，提取标题、摘要、文章链接和 `postTime`，不执行 JavaScript、无需登录或私有账号。它们是平台专栏，不能视为公众号直连；平台发布日可能晚于原公众号或官网首发日。短剧自习室官网与其专栏、DataEye 报告与其专栏共用原媒体归属，仍按正文和事件去重。旧版骨朵专栏停留在 2021 年、新腕儿旧专栏停留在 2024 年的结果没有加入。

新腕儿首页本身不含可采集文章链接；使用其页面实际调用的公开、只读表单列表，提交页码和页大小，以文章 ID 生成原文链接，并读取条目中原始完整发布时间。广电总局读取公告列表中 XML CDATA 的 HTML 条目。中文在线卡片读取 `data-link` 与页面日期；不以图片上传日或抓取时间补发布日期。

ReelShort 母公司和阅文的列表链接包含外部媒体报道；HOLYWATER 列表也混有公司与媒体内容，这三者标为 `first_party: false`、T1_5。广东行业动态中包含转载，按 T1_5；官方原始公告与公司新闻按其真实来源分级。所有来源默认关闭全文展示及全文分发。

Vertical Drama 与 Streaming Radar 共用归属。前者只收 `/news/` 路径，排除每周作品排行，防止把榜单页当新增产业新闻。HOLYWATER 当前没有日期的卡片不采集。当前没有近 30 天记录的报告及政策入口继续监测，30 天历史窗口阻止其旧记录回灌。

表中最近匹配日期按 UTC 展示；逐条时间带时区，国内凌晨发布可能对应前一 UTC 日。原始响应哈希、请求方式、来源网址及逐源核验时间见 [source-checks.json](source-checks.json)。

### 国内行业媒体与研究（16）

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

### 平台与制作发行公司（6）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 快手 · 公司公告与 AI 内容业务<br>`rss-kuaishou-company-news` | [列表](https://ir.kuaishou.com/rss/news-releases.xml) | T1 | 2026-07-21 | 0 |
| 爱奇艺 · 官方新闻与 AI 制作<br>`rss-iqiyi-company-news` | [列表](https://ir.iqiyi.com/rss/news-releases.xml) | T1 | 2026-09-23 | 1 |
| 中文在线 · 官方新闻<br>`web-col-news` | [列表](https://www.col.com/list-e6jni41m/guanfangxinwen/2/10) | T1 | 2026-07-29 | 0 |
| Crazy Maple Studio / ReelShort · 媒体报道<br>`web-crazy-maple-news` | [列表](https://crazymaplestudios.com/maple-news) | T1_5 | 2026-08-27 | 0 |
| 阅文集团 · 媒体报道<br>`web-yuewen-news` | [列表](https://www.yuewen.com/news) | T1_5 | 2026-08-10 | 0 |
| HOLYWATER TECH / My Drama · 公开新闻<br>`web-holywater-news` | [列表](https://www.holywater.tech/blog) | T1_5 | 2026-09-02 | 0 |

### 监管公告（3）

| 信源 / ID | 公开入口 | 分级 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 国家广电总局 · 公告公示<br>`web-nrta-notices` | [列表](https://www.nrta.gov.cn/col/col113/index.html) | T1 | 2026-09-30 | 1 |
| 广东省广电局 · 通知公告<br>`web-guangdong-notices` | [列表](https://gbdsj.gd.gov.cn/zxzx/tzgg/) | T1 | 2026-06-10 | 0 |
| 广东省广电局 · 行业动态<br>`web-guangdong-industry` | [列表](https://gbdsj.gd.gov.cn/zxzx/hydt/) | T1_5 | 2026-10-04 | 3 |

### 海外竖屏剧媒体与简报（10）

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

### 过滤与成本边界

泛影视列表在详情抓取和模型处理之前，按 AI 创作或微短剧/漫剧/竖屏剧关键词限范围；普通剧情介绍、演员八卦、追剧推荐不因出现短剧或平台名而成为产业信息。监管、平台分账、保底、流量入口、扶持与准入、制作发行、版权合作、经营和市场研究可通过相关性预筛，即使没有 AI 参与。通用 AI 与纯时政的过滤边界保持。相关性通过之后仍走原有评分、去重与归组。

该轮给 No Film School、Cartoon Brew、80 Level、Animation Magazine、ProVideo Coalition、Videomaker、Filmmaker Magazine、Filmmakers Academy 增加短剧产业关键词。这 8 个仍是原入口，不重复计入新增。

每个新增入口限制 30 天有日期历史、首轮最多 3 条，媒体约 3 小时轮询，低频报告和公告每 6–12 小时；同一媒体、公司、平台的多个入口共用归属。公开列表读取没有按次付费服务费用，但服务器、正文处理、精选、向量、归组和写作仍可能产生费用。没有调低评分门槛或调整模型预算。

### 尚未接入的候选

| 候选 | 本次结果 |
|---|---|
| 红果 / 抖音短剧创作者中心 | 官网身份可确认，公开首页未解析到带日期的公告列表；不将登录后台计为已接入 |
| 九州文化 / ShortMax | 当前官网请求返回错误，保留候选，未计数 |
| 点众官网静态新闻页 | 当前静态样例主要停留在 2021 年；不以公司首页或产品目录当新闻信源 |
| 骨朵旧搜狐专栏、新腕儿旧搜狐专栏 | 匹配记录停留在 2021 / 2024 年，未加入 |
| 北京公告与政策列表、华策列表、QuestMobile 当前列表 | 本次未从标题范围解析出短剧匹配；未新增这些入口 |
| 部分微短剧标签 RSS | 返回空订阅、错误页或没有匹配，未计数；同一媒体多个重叠查询只保留一个有效入口 |
| 同名短剧平台网站 | 来源身份缺乏依据，不作为平台官方信源 |

### 导入与验证

导入方法见 [source-operations.md](source-operations.md)。seed 只新增，保留已有来源 ID、手工配置、暂停状态，并跳过同类地址别名；如需将 8 个旧源应用新过滤规则，应在后台核对配置后更新，seed 不会自动覆盖。

验证使用公开 HTTP 捕获和仓库实际 RSS/HTML/JSON 解析器，不写数据库、不抓正文、不调用模型；自动测试用本地样本。JSON 专栏使用固定公开页面结构，页面改版时可能需要更新字段路径。新增源的生产稳定性、实际日增量与精选成本需在导入启用后，通过后台来源产出和回执统计观察。
