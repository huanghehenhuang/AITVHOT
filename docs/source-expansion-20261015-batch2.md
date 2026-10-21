# 2026-10-15 第二批：继续补创作方法与开源工具

新增并启用 **10 个来源**：4 个创作博客/教程入口、6 个开源制作工具与工作流发布源。当前配置库 365 个；运行库 384 个、启用 382 个。本批全部有近 30 天可解析内容，导入前匹配 108 条；实际收进 29 条，26 条进入全部动态、0 条入选精选。处理状态：analyzed 26、new 3。这是回补与即时采集快照，不是日均承诺。

| 来源 | 类型 | 核验近期匹配 | 实际入库 |
|---|---|---:|---:|
| ai-video-production-editor · 开源创作项目发布 | web_list | 1 | 1 |
| ai-film-skills · 开源创作项目发布 | web_list | 1 | 1 |
| ai-art-engine · 开源创作项目发布 | web_list | 10 | 3 |
| StabilityMatrix · 开源创作项目发布 | web_list | 1 | 1 |
| workflow_templates · 开源创作项目发布 | web_list | 10 | 4 |
| sd-webui-infinite-image-browsing · 开源创作项目发布 | web_list | 1 | 1 |
| Frank Houbre · AI电影制作实战 | rss | 23 | 5 |
| Creator Animation · AI影片制作教程 | rss | 50 | 5 |
| Theoretically Media · 电影人AI实测 | web_list | 3 | 0 |
| Ciaro · 中文AI电影制作教程 | web_list | 8 | 8 |

本批侧重可操作的电影制作、分镜、图像管理、节点式制作和模型工作流。Theoretically Media 的 YouTube 订阅此前不可读，本次接入同一创作者的公开博客，已能取得 3 篇近期实测；不把视频网站订阅失败伪称为已接通。Frank Houbre 采用主页声明的 RSS，保留法语原文链接，进入本站既有中文摘要流程。Creator Animation 使用官网声明的博客订阅；Ciaro 使用中文教程页面，列表只显示月份的条目补读原文发布时间，不能确认日期的记录不入库。

GitHub 继续采集项目官方公开发布网页，不调用已经耗尽匿名额度的 API；发布日期取“released this”区块的 relative-time 字段，不使用仓库更新时间或普通提交。发布说明从 markdown-body 取得。代码项目为 T1_5 / 一手，博客教程为 T2，默认关闭全文展示与全文分发，不修改评分门槛和模型预算。

已有项目按归属与地址核对，不重复添加 Krita AI Diffusion、InvokeAI、SD.Next、SwarmUI 等现有来源。StoryboardAI、部分 ComfyUI 节点等无正式发布；Fooocus、AUTOMATIC1111、Upscayl 等当前无近 30 天发布，未用这些入口凑新增。PYROS 首页教程可读但没有确认到近期发布日期，ComfyDeploy 列表停留在较早日期，均未导入。

新项目首轮最多 3 条，博客首轮最多 5 条；后续采集按现有发现窗口继续，因此实际入库可能超过首轮上限。Ciaro 详情每轮最多补读 8 条，设置固定发布日期下界和滚动 30 天限制；不以抓取时间伪造发布日期。全部 10 个来源的最后采集均为 ok。

## 验证与证据

- [已导入配置与近期样本](source-expansion-20261015-batch2-checks.json)
- [候选、停更和失败记录](source-expansion-20261015-batch2-candidates.json)
- [逐源采集健康与发布快照](source-expansion-20261015-batch2-runtime.json)

来源专项 24/24 通过；类型检查、Web 构建、站点/API/MCP 冒烟通过。全量测试 778 项：759 通过、19 失败；Web 54 项：37 通过、17 失败。失败明细在日志，不声称全量绿色。5 个 Windows SIGTERM 挂起用例按名称排除，未声称覆盖。独立测试数据库、外部推送关闭，日志在工作区 .tools/expand6-*.log。
