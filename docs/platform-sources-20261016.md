# 2026-10-16：接入 YouTube 视频频道与复核 GitHub

新增启用 9 个 YouTube 原生视频订阅，配置包 852 个；运行库 871 个、启用 868 个。通过频道主页确认频道 ID，原生 RSS 多次读取成功；每个频道近 30 天都有创作相关内容，最后入库前复查合计 44 条近期匹配，首轮每源最多 3 条。这里只展示描述摘要和视频原链接，不把播放器页面当正文或字幕。

| 频道 | 健康 | 入库 | 公开动态 |
|---|---|---:|---:|
| Aitrepreneur · YouTube 创作视频 | ok | 2 | 2 |
| MattVidPro · YouTube 创作视频 | ok | 3 | 2 |
| NerdyRodent · YouTube 创作视频 | ok | 1 | 1 |
| TheoreticallyMedia · YouTube 创作视频 | ok | 3 | 1 |
| comfyorg · YouTube 创作视频 | ok | 3 | 0 |
| curiousrefuge · YouTube 创作视频 | ok | 3 | 3 |
| mickmumpitz · YouTube 创作视频 | ok | 1 | 1 |
| pixaroma · YouTube 创作视频 | ok | 3 | 1 |
| sebastiankamph · YouTube 创作视频 | ok | 2 | 2 |

快照：新增共 21 条素材、13 条公开动态、2 条精选；未完成处理的按既有队列继续，不强制放行。数量不是日均产出。

## GitHub 排查

GitHub 已配置 71 个来源，174 条材料入库、130 条公开动态；不是完全没采到。5 个个人新仓库 API 曾报 HTTP 403，本次原入口读取和实际采集均恢复成功，来源健康也恢复为 ok。它们读取 created_at，仅发现新建仓库；近 30 天没有匹配的新项目，所以实际采集新增为 0。不能把 pushed_at、提交或仓库更新时间替代为项目发布日期。这里只确认本次恢复，不保证匿名接口以后不会再触发限流。

还实测了这些作者的 21 个未收录项目 releases.atom，均无近 30 天正式发布，未为增加数字而导入空订阅。作者活动流的提交、分支和 issue 讨论也不伪装成新项目发布。既有项目发布源继续采集，旧文章与配置保留。

## 不导入的候选与限制

Olivio Sarikas 本次订阅可读，但近 30 天没有匹配内容；Matt Wolfe、Matthew Berman、AI Explained 通过创作主题筛选后没有近期匹配；AI Master 主要为宽泛 AI 新闻，不在本批导入。失效的两个猜测频道地址返回 404，也未导入。YouTube 曾连续返回 404/500，本次恢复可读后才正式启用，短时成功不是长期可用性保证。

## 验证

- 852 个配置通过合法字段、重复 ID、重复地址及公开 HTTPS 检查。
- 多次真实 RSS 解析、入库和公开结果分别记录；没有修改评分、预算、模型或安全阀。
- [逐源配置与近期样本](platform-sources-20261016-checks.json)；[健康与逐篇处理快照](platform-sources-20261016-runtime.json)。
- 采集、RSS 和视频摘要的专项测试 23/23 通过，站点 smoke 通过；日志保存在工作区 .tools/platform-tests.log、platform-smoke.log。
