# AI 影视信源清单

本轮验证日期：2026-10-09。配置现有 **231 个入口**：23 → 122 → 162 → 197 → 218 → 231，本轮再新增 **13 个短剧相关入口**；短剧专题累计补充 69 个入口，另有 8 个既有影视媒体扩展短剧主题范围。相对当前 main 的 12 个基础源共增加 219 个。不包含仅在线上数据库中的 X、公众号付费账号或其他手工来源。

| 类型 | 入口数 |
|---|---:|
| RSS / Atom | 130 |
| 普通 HTML 列表 | 45 |
| 公开 JSON / HTML 内嵌 JSON | 56 |

216 个入口进入原有精选流程，15 个开源版本更新入口仅作热度证据。热度证据也可能产生向量与归组费用。非空 `owner_entity_id` 有 179 个不同归属，另外 8 个入口未显式设置归属，按各自 ID 分别计数时共 187 组；这是清单口径，231 个入口不等同于独立网站数。

## 本轮补充与验证口径

本轮新增 13 个短剧/漫剧相关入口，全部有非空解析、主题匹配和可解析日期；11 个入口在核验时含近 30 天匹配条目，共 84 条。补充番茄小说改编激励公告、Vertical Observer、Open Gardens、Plot Party、SocialPeta、AppGrowing、影视产业观察，以及湖南、四川、辽宁公开部门列表。四川两类列表当前仅有较旧匹配，作为新发布监测。前两轮新增 56 个短剧入口保留，不重复计为本轮新增。名单、归属与日期口径见 [短剧信源说明](short-drama-sources.md)。

全库 231 个列表的最近一次验证记录均为非空；223 个快照有匹配内容，8 个没有匹配内容，157 个在各自验证时含近 30 天匹配条目。旧源沿用逐条原有验证时间，本轮重新捕获 13 个新入口；最终跳转地址、HTTP 状态、日期和响应 SHA-256 见 [source-checks.json](source-checks.json)。Plot Party 用 5 次原始文章元数据响应补齐发布日期，其列表本身只有周报覆盖区间。全部匹配条目均有可解析日期，明确超龄的旧资料不会进入新配置的回灌。

这些是公开列表快照，不是线上采集成功率、日均产量或精选入选率。下表统计在来源内进行，尚未跨 URL、来源与事件去重；正文提取和模型筛选由后续流程决定。

```bash
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts --live
```

第二条命令显式联网，只读取公开列表，不入库、不抓正文或详情、不启动 worker、不调用模型或 X/公众号付费 API；Plot Party 的日期元数据验证另见短剧说明与逐源记录。列表暂时没有主题匹配记为提示，抓取或解析失败才返回失败；自动测试使用本地样本，不访问外网。

## 采集与处理成本

- 全部基础配置限制 30 天有日期历史，首轮最多 3 条。没有日期的未来条目依原规则保留；已有数据库配置由 seed 保留。
- 宽泛 AI 媒体按影视关键词过滤，影视媒体按 AI 或短剧产业关键词过滤，音频媒体按 AI 关键词过滤；原先较宽的 OpenAI、Google、DeepMind、Hugging Face 和综合媒体示例也补上主题范围。过滤发生在详情补齐、入库和模型调用前。
- `requireMarkers` 保留字面子串匹配；短词 `AI`、`Udio` 使用 `requireWords` 整词检查，避免 `air`、`paid`、`audio` 等普通词误命中。关键词只是入口范围，最终重要性仍由原有精选流程决定。
- Hugging Face 每个作者只配一个列表，按 `createdAt` 监测新仓库；不将权重、提交或修改时间当成新发布。排除常见重复权重格式。
- 同一厂商的官网、模型列表、发布日志和公开公众号订阅共用来源身份，避免重复贡献热度。
- RSS 沿用条件请求和 URL 判重；HTML/JSON 直接读取，不配置 Jina。列表采集无需按次付费 API；正文、精选、写作、向量和归组仍可能产生费用。全文展示与分发均关闭，评分门槛、模型选择及预算额度未改变。

新增公众号入口中的 7 个由公开 RSS 桥接服务提供，配置标注「公共 RSS 桥接」，`first_party` 为 false；媒体按 T2，厂商账号按 T1_5，并归入对应厂商。它们依赖第三方转换服务，可能延迟、漏文或停用，不能视为官方 RSS 的可用性承诺，也不代表已免费接入全部公众号。

Runway 使用官网嵌套 Flight 数组，MiniMax 使用混合日期格式，字节 Seed 使用原始发布日；Luma 按官网新闻卡片取日期，排除 Blog 类 SEO 文章。创作者简报读取公开网页上的原始日期。入口可能发生官网跳转，实际最终地址见逐源记录。

短剧产业预筛补齐备案、审核、分账、扶持、制作发行、版权合作、译制出海与经营研究等实质信息，即使没有 AI 参与也可通过相关性预筛；剧情介绍、追剧推荐、演员八卦和通用 AI 新闻仍按原边界过滤。评分结构、权重与门槛不变，相关性通过不等于精选入选。

## 导入与未纳入入口

已有站点可先只读预览，再分批启用新来源；导入会保留同 ID 的手工修改，并沿用后台同类地址/账号判重规则，跳过不同 ID 的地址别名。操作命令与边界见 [source-operations.md](source-operations.md)。

未将返回错误页的 Substack/YouTube RSS、空的发布订阅、无可用日期、很旧的教程和只有无关条目的新候选作为扩容数量。Prompt Muse 的当前 RSS 内容仍停在 2024 年，InfoQ 示例 feed 与 Pixar 样例订阅也未加入；这些结果不表示作者或项目停止更新。网页、账号与接口会变化，后续用后台产出与回执继续核验。

## 官方公告与产品博客（39）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| OpenAI News<br>`rss-openai-news` | [列表](https://openai.com/news/rss.xml) | 精选 | 2026-09-23 | 6 |
| Google AI Blog（Veo 发布渠道）<br>`rss-google-ai-blog` | [列表](https://blog.google/technology/ai/rss/) | 精选 | 2026-09-09 | 1 |
| Google DeepMind<br>`rss-deepmind` | [列表](https://deepmind.google/blog/rss.xml) | 精选 | 2026-09-23 | 1 |
| Hugging Face Blog（开源视频模型常首发于此）<br>`rss-hugging-face` | [列表](https://huggingface.co/blog/feed.xml) | 精选 | 2026-09-30 | 1 |
| Comfy 官方博客<br>`rss-comfy-blog` | [列表](https://blog.comfy.org/feed) | 精选 | 2026-10-06 | 8 |
| fal 官方博客<br>`rss-fal-blog` | [列表](https://blog.fal.ai/rss/) | 精选 | 2026-09-17 | 1 |
| Stability AI 官方新闻<br>`rss-stability-news` | [列表](https://stability.ai/news-updates?format=rss) | 精选 | 2026-08-25 | 0 |
| ElevenLabs 产品与研究<br>`rss-elevenlabs-blog` | [列表](https://elevenlabs.io/blog/rss.xml) | 精选 | 2026-10-08 | 19 |
| Replicate 官方博客<br>`rss-replicate-blog` | [列表](https://replicate.com/blog/rss) | 精选 | 2026-04-15 | 0 |
| Black Forest Labs 官方博客<br>`web-bfl-blog` | [列表](https://bfl.ai/blog) | 精选 | 2026-09-23 | 1 |
| Midjourney 官方更新<br>`rss-midjourney` | [列表](https://updates.midjourney.com/rss/) | 精选 | 2026-10-02 | 4 |
| Kapwing 创作指南<br>`rss-kapwing` | [列表](https://www.kapwing.com/resources/rss/) | 精选 | 2026-10-07 | 10 |
| Freepik / Magnific 官方博客<br>`rss-freepik` | [列表](https://www.magnific.com/blog/rss/) | 精选 | 2026-09-29 | 15 |
| Blender 官方新闻<br>`rss-blender-news` | [列表](https://www.blender.org/feed/) | 精选 | 本次未匹配 | 0 |
| Blender 开发博客<br>`rss-blender-development` | [列表](https://code.blender.org/feed/) | 热度证据 | 本次未匹配 | 0 |
| NVIDIA · Generative AI<br>`rss-nvidia-generative-ai` | [列表](https://blogs.nvidia.com/blog/category/generative-ai/feed/) | 精选 | 本次未匹配 | 0 |
| Higgsfield 官方博客<br>`rss-higgsfield-rss` | [列表](https://higgsfield.ai/blog/rss.xml) | 精选 | 2026-10-06 | 42 |
| 可灵官方博客<br>`web-kling` | [列表](https://kling.ai/blog) | 精选 | 2026-10-02 | 13 |
| PixVerse 中文官方博客<br>`web-pixverse` | [列表](https://pixverse.ai/zh/blog) | 精选 | 2026-09-22 | 13 |
| Krea 官方博客<br>`web-krea` | [列表](https://www.krea.ai/blog) | 精选 | 2026-10-05 | 34 |
| LTX Studio 创作与产品博客<br>`web-ltx-studio` | [列表](https://ltx.io/blog) | 精选 | 2026-10-03 | 17 |
| Recraft 官方博客<br>`web-recraft` | [列表](https://www.recraft.ai/blog) | 精选 | 2026-10-08 | 16 |
| Hedra 官方博客<br>`web-hedra` | [列表](https://www.hedra.com/blog) | 精选 | 2026-10-06 | 2 |
| Cartesia 官方博客<br>`web-cartesia` | [列表](https://www.cartesia.ai/blog) | 精选 | 2026-09-23 | 2 |
| Suno 官方博客<br>`web-suno` | [列表](https://suno.com/blog) | 精选 | 2026-10-05 | 4 |
| Captions / Mirage 官方博客<br>`web-captions-web` | [列表](https://captions.ai/blog) | 精选 | 2026-08-17 | 0 |
| Vidu 官方创作博客<br>`web-vidu` | [列表](https://www.vidu.com/blog) | 精选 | 2026-06-12 | 0 |
| Canva 官方新闻室<br>`json-canva` | [列表](https://www.canva.com/newsroom/news/) | 精选 | 2026-09-29 | 4 |
| Runway 官方新闻<br>`json-runway` | [列表](https://runway.com/news) | 精选 | 2026-09-30 | 15 |
| MiniMax 官方新闻<br>`json-minimax-api` | [列表](https://www.minimax.io/api/news?page=1&locale=en) | 精选 | 2026-08-03 | 0 |
| 字节 Seed 官方博客<br>`json-bytedance-seed-api` | [列表](https://seed.bytedance.com/api/get_article_list_v2?article_type=2&count=20&order_desc=true) | 精选 | 2026-08-04 | 0 |
| HeyGen Updates<br>`rss-heygen-updates` | [列表](https://heygen.noticeable.news/feed.rss) | 精选 | 2026-10-05 | 1 |
| Podcastle<br>`rss-podcastle` | [列表](https://async.com/blog/rss/) | 精选 | 2026-10-06 | 10 |
| LALAL AI<br>`rss-lalalai` | [列表](https://www.lalal.ai/blog/rss/) | 精选 | 2026-10-07 | 6 |
| Unity<br>`rss-unity` | [列表](https://unity.com/cn/blog/rss) | 精选 | 2026-09-24 | 3 |
| Apple Machine Learning Research<br>`rss-apple-ml` | [列表](https://machinelearning.apple.com/rss.xml) | 精选 | 2026-10-02 | 1 |
| Reallusion<br>`rss-reallusion` | [列表](https://magazine.reallusion.com/feed/) | 精选 | 2026-10-08 | 2 |
| Epidemic Sound<br>`rss-epidemic` | [列表](https://www.epidemicsound.com/blog/rss/) | 精选 | 2026-09-21 | 2 |
| Luma News<br>`web-luma-news` | [列表](https://lumalabs.ai/news) | 精选 | 2026-10-01 | 1 |

## 官方模型发布（31）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| 通义万相 · 模型发布<br>`json-hf-wan-ai` | [列表](https://huggingface.co/api/models?author=Wan-AI&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-07-14 | 0 |
| 字节跳动 · 视觉模型<br>`json-hf-bytedance` | [列表](https://huggingface.co/api/models?author=ByteDance&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-07-13 | 0 |
| 字节 Seed · 创作模型<br>`json-hf-bytedance-seed` | [列表](https://huggingface.co/api/models?author=ByteDance-Seed&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2025-07-02 | 0 |
| MiniMax · 音视频模型<br>`json-hf-minimaxai` | [列表](https://huggingface.co/api/models?author=MiniMaxAI&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-08-07 | 0 |
| 快手 Kolors · 视觉模型<br>`json-hf-kwai-kolors` | [列表](https://huggingface.co/api/models?author=Kwai-Kolors&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-07-11 | 0 |
| 通义千问 · 图像与音频模型<br>`json-hf-qwen` | [列表](https://huggingface.co/api/models?author=Qwen&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-09-20 | 3 |
| 阶跃星辰 · 音视频与图像模型<br>`json-hf-focused-stepfun-ai` | [列表](https://huggingface.co/api/models?author=stepfun-ai&search=Step&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-05-23 | 0 |
| Lightricks · LTX 模型<br>`json-hf-lightricks` | [列表](https://huggingface.co/api/models?author=Lightricks&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-09-28 | 14 |
| Black Forest Labs · FLUX 模型<br>`json-hf-black-forest-labs` | [列表](https://huggingface.co/api/models?author=black-forest-labs&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-09-22 | 3 |
| Stability AI · 创作模型<br>`json-hf-stabilityai` | [列表](https://huggingface.co/api/models?author=stabilityai&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-05-18 | 0 |
| 智谱 · 图像模型<br>`json-hf-focused-zai-org` | [列表](https://huggingface.co/api/models?author=zai-org&search=Image&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-01-08 | 0 |
| 通义 MAI · Z-Image<br>`json-hf-tongyi-mai` | [列表](https://huggingface.co/api/models?author=Tongyi-MAI&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-01-23 | 0 |
| 通义 · 语音模型<br>`json-hf-funaudiollm` | [列表](https://huggingface.co/api/models?author=FunAudioLLM&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-08-29 | 0 |
| Fish Audio · 语音模型<br>`json-hf-fishaudio` | [列表](https://huggingface.co/api/models?author=fishaudio&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-03-09 | 0 |
| Resemble AI · 语音模型<br>`json-hf-resembleai` | [列表](https://huggingface.co/api/models?author=ResembleAI&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-05-28 | 0 |
| F5-TTS · 语音模型<br>`json-hf-swivid` | [列表](https://huggingface.co/api/models?author=SWivid&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-01-21 | 0 |
| IndexTTS · 语音模型<br>`json-hf-indexteam` | [列表](https://huggingface.co/api/models?author=IndexTeam&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-10-02 | 11 |
| NVIDIA · Cosmos 模型<br>`json-hf-focused-nvidia` | [列表](https://huggingface.co/api/models?author=nvidia&search=Cosmos&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-07-21 | 0 |
| Zyphra · Zonos 语音模型<br>`json-hf-zyphra` | [列表](https://huggingface.co/api/models?author=Zyphra&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-06-11 | 0 |
| Kyutai · 音视频模型<br>`json-hf-kyutai` | [列表](https://huggingface.co/api/models?author=kyutai&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-09-29 | 4 |
| ACE-Step · 音乐模型<br>`json-hf-ace-step` | [列表](https://huggingface.co/api/models?author=ACE-Step&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-04-10 | 0 |
| 腾讯混元 · 音视频与图像模型<br>`json-hf-focused-tencent` | [列表](https://huggingface.co/api/models?author=tencent&search=Hunyuan&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-01-25 | 0 |
| Vchitect · 视频模型<br>`json-hf-vchitect` | [列表](https://huggingface.co/api/models?author=Vchitect&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2025-12-14 | 0 |
| 昆仑万维 · SkyReels<br>`json-hf-skywork` | [列表](https://huggingface.co/api/models?author=Skywork&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-03-27 | 0 |
| 美团 LongCat · 创作模型<br>`json-hf-focused-meituan-longcat` | [列表](https://huggingface.co/api/models?author=meituan-longcat&search=LongCat&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-05-21 | 0 |
| 腾讯 ARC · 创作模型<br>`json-hf-tencentarc` | [列表](https://huggingface.co/api/models?author=TencentARC&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-09-21 | 3 |
| HiDream · 图像模型<br>`json-hf-hidream-ai` | [列表](https://huggingface.co/api/models?author=HiDream-ai&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2026-05-13 | 0 |
| Microsoft · TRELLIS 3D<br>`json-hf-focused-microsoft` | [列表](https://huggingface.co/api/models?author=microsoft&search=TRELLIS&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2025-12-01 | 0 |
| Meta · SAM 图像/音频工具<br>`json-hf-focused-facebook` | [列表](https://huggingface.co/api/models?author=facebook&search=sam&sort=createdAt&direction=-1&limit=100&full=true&config=false) | 精选 | 2026-03-26 | 0 |
| InstantX · 视觉模型<br>`json-hf-instantx` | [列表](https://huggingface.co/api/models?author=InstantX&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2025-09-08 | 0 |
| Shakker Labs · 图像模型<br>`json-hf-shakker-labs` | [列表](https://huggingface.co/api/models?author=Shakker-Labs&sort=createdAt&direction=-1&limit=20&full=true&config=false) | 精选 | 2025-12-14 | 0 |

## 开源创作工具与发布订阅（27）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| ComfyUI GitHub Releases（工作流生态核心）<br>`rss-comfyui-releases` | [列表](https://github.com/comfyanonymous/ComfyUI/releases.atom) | 热度证据 | 2026-10-07 | 10 |
| LTX-2 官方发布<br>`rss-ltx2-releases` | [列表](https://github.com/Lightricks/LTX-2/releases.atom) | 精选 | 2026-10-02 | 3 |
| Diffusers 官方发布<br>`rss-diffusers-releases` | [列表](https://github.com/huggingface/diffusers/releases.atom) | 热度证据 | 2026-10-06 | 1 |
| InvokeAI 官方发布<br>`rss-invokeai-releases` | [列表](https://github.com/invoke-ai/InvokeAI/releases.atom) | 精选 | 2026-10-04 | 3 |
| Fish Speech 官方发布<br>`rss-fish-speech-releases` | [列表](https://github.com/fishaudio/fish-speech/releases.atom) | 精选 | 2026-03-10 | 0 |
| krita-ai-diffusion 官方发布<br>`rss-acly--krita-ai-diffusion` | [列表](https://github.com/Acly/krita-ai-diffusion/releases.atom) | 精选 | 2026-10-03 | 2 |
| kohya_ss 官方发布<br>`rss-bmaltais--kohya_ss` | [列表](https://github.com/bmaltais/kohya_ss/releases.atom) | 热度证据 | 2026-07-09 | 0 |
| buzz 官方发布<br>`rss-chidiwilliams--buzz` | [列表](https://github.com/chidiwilliams/buzz/releases.atom) | 精选 | 2026-08-28 | 0 |
| ComfyUI_frontend 官方发布<br>`rss-comfy-org--comfyui_frontend` | [列表](https://github.com/Comfy-Org/ComfyUI_frontend/releases.atom) | 热度证据 | 2026-10-07 | 10 |
| desktop 官方发布<br>`rss-comfy-org--desktop` | [列表](https://github.com/Comfy-Org/desktop/releases.atom) | 热度证据 | 2026-05-28 | 0 |
| facefusion 官方发布<br>`rss-facefusion--facefusion` | [列表](https://github.com/facefusion/facefusion/releases.atom) | 精选 | 2026-09-30 | 2 |
| SenseVoice 官方发布<br>`rss-funaudiollm--sensevoice` | [列表](https://github.com/QwenAudio/SenseVoice/releases.atom) | 精选 | 2026-08-27 | 0 |
| whisper.cpp 官方发布<br>`rss-ggerganov--whisper.cpp` | [列表](https://github.com/ggml-org/whisper.cpp/releases.atom) | 热度证据 | 2026-10-07 | 5 |
| index-tts 官方发布<br>`rss-index-tts--index-tts` | [列表](https://github.com/index-tts/index-tts/releases.atom) | 精选 | 2026-08-13 | 0 |
| pyvideotrans 官方发布<br>`rss-jianchang512--pyvideotrans` | [列表](https://github.com/jianchang512/pyvideotrans/releases.atom) | 精选 | 2026-10-07 | 4 |
| sd-scripts 官方发布<br>`rss-kohya-ss--sd-scripts` | [列表](https://github.com/kohya-ss/sd-scripts/releases.atom) | 热度证据 | 2026-09-24 | 1 |
| whisperX 官方发布<br>`rss-m-bain--whisperx` | [列表](https://github.com/m-bain/whisperX/releases.atom) | 热度证据 | 2026-06-26 | 0 |
| SwarmUI 官方发布<br>`rss-mcmonkeyprojects--swarmui` | [列表](https://github.com/mcmonkeyprojects/SwarmUI/releases.atom) | 精选 | 2026-03-10 | 0 |
| lossless-cut 官方发布<br>`rss-mifi--lossless-cut` | [列表](https://github.com/mifi/lossless-cut/releases.atom) | 热度证据 | 2026-06-17 | 0 |
| shotcut 官方发布<br>`rss-mltframework--shotcut` | [列表](https://github.com/mltframework/shotcut/releases.atom) | 热度证据 | 2026-10-05 | 2 |
| LichtFeld-Studio 官方发布<br>`rss-mrnerf--lichtfeld-studio` | [列表](https://github.com/MrNeRF/LichtFeld-Studio/releases.atom) | 精选 | 2026-09-23 | 2 |
| piper1-gpl 官方发布<br>`rss-ohf-voice--piper1-gpl` | [列表](https://github.com/OHF-Voice/piper1-gpl/releases.atom) | 热度证据 | 2026-09-04 | 0 |
| openshot-qt 官方发布<br>`rss-openshot--openshot-qt` | [列表](https://github.com/OpenShot/openshot-qt/releases.atom) | 热度证据 | 2026-09-27 | 1 |
| subtitleedit 官方发布<br>`rss-subtitleedit--subtitleedit` | [列表](https://github.com/SubtitleEdit/subtitleedit/releases.atom) | 热度证据 | 2026-10-07 | 10 |
| F5-TTS 官方发布<br>`rss-swivid--f5-tts` | [列表](https://github.com/SWivid/F5-TTS/releases.atom) | 精选 | 2026-07-23 | 0 |
| faster-whisper 官方发布<br>`rss-systran--faster-whisper` | [列表](https://github.com/SYSTRAN/faster-whisper/releases.atom) | 热度证据 | 2025-10-31 | 0 |
| sdnext 官方发布<br>`rss-vladmandic--sdnext` | [列表](https://github.com/vladmandic/sdnext/releases.atom) | 精选 | 2026-07-14 | 0 |

## 创作者、教程与作品（9）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| Curious Refuge 创作教程<br>`rss-curious-refuge` | [列表](https://curiousrefuge.com/blog?format=rss) | 精选 | 2026-10-02 | 9 |
| Latent Space<br>`rss-latentspace` | [列表](https://www.latent.space/feed) | 精选 | 2026-09-29 | 3 |
| Stable Diffusion Art 教程<br>`rss-stable-diffusion-art` | [列表](https://stable-diffusion-art.com/feed/) | 精选 | 2026-03-02 | 0 |
| Curious Refuge film gallery<br>`rss-curious-gallery` | [列表](https://curiousrefuge.com/ai-film-gallery?format=rss) | 精选 | 2026-10-07 | 20 |
| Theoretically Media blog<br>`web-theoretically-media` | [列表](https://theoreticallymedia.com/blog/) | 精选 | 2026-10-06 | 7 |
| Theoretically Media<br>`web-theoretically-news` | [列表](https://theoreticallymedia.beehiiv.com/) | 精选 | 2026-09-18 | 1 |
| AI For Real Life<br>`web-ai-for-real-life` | [列表](https://ai-for-real-life.beehiiv.com/) | 精选 | 2026-06-28 | 0 |
| AIography · Lawrence Jordan<br>`web-aiography` | [列表](https://aiography.beehiiv.com/) | 精选 | 2026-09-11 | 1 |
| Slop Reel · AI 视频制作简报<br>`web-slop-reel` | [列表](https://www.slopreel.com/) | 精选 | 2026-10-07 | 6 |

## 新增国内媒体与公众号公开订阅（11）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| 智东西<br>`rss-zhidx` | [列表](https://zhidx.com/rss) | 精选 | 2026-10-08 | 13 |
| 开源中国<br>`rss-oschina` | [列表](https://www.oschina.net/news/rss) | 精选 | 2026-10-08 | 4 |
| 钛媒体<br>`rss-tmtpost` | [列表](https://www.tmtpost.com/rss.xml) | 精选 | 2026-10-08 | 2 |
| cnBeta<br>`rss-cnbeta` | [列表](https://www.cnbeta.com.tw/backend.php) | 精选 | 2026-10-08 | 20 |
| 我爱计算机视觉 · 公开公众号 RSS<br>`rss-wechat-cv` | [列表](https://wechat2rss.xlab.app/feed/b81ffcfff1107b5265cd7e39de610dc7ca72caf4.xml) | 精选 | 2026-10-04 | 9 |
| 新智元 · 公开公众号 RSS<br>`rss-wechat-xinzhiyuan` | [列表](https://wechat2rss.xlab.app/feed/ede30346413ea70dbef5d485ea5cbb95cca446e7.xml) | 精选 | 2026-10-06 | 1 |
| 机器之心 · 公开公众号 RSS<br>`rss-wechat-jiqizhixin` | [列表](https://wechat2rss.bestblogs.dev/feed/8d97af31b0de9e48da74558af128a4673d78c9a3.xml) | 精选 | 2026-10-07 | 2 |
| 机器之心SOTA模型 · 公开公众号 RSS<br>`rss-wechat-jiqizhixin-sota` | [列表](https://wechat2rss.bestblogs.dev/feed/2f520471856d56c7b3a95cd09eb777149b32828a.xml) | 精选 | 2026-09-30 | 9 |
| 腾讯混元 · 公开公众号 RSS<br>`rss-wechat-tencent-hunyuan` | [列表](https://wechat2rss.bestblogs.dev/feed/306ce19a1ca590c9c2df781789e828d1acfa1356.xml) | 精选 | 2026-09-22 | 1 |
| 通义实验室 · 公开公众号 RSS<br>`rss-wechat-tongyi` | [列表](https://wechat2rss.bestblogs.dev/feed/4ebee6222ae08705b8aabc9116f0defbcb6b17c6.xml) | 精选 | 2026-07-20 | 0 |
| 阶跃StepFun · 公开公众号 RSS<br>`rss-wechat-stepfun` | [列表](https://wechat2rss.bestblogs.dev/feed/3e2714d06aa36142e8ed6b3f4e5cf9090a069dd2.xml) | 精选 | 2026-09-15 | 1 |

## 影视、音频与 AI 媒体社区（45）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| The Verge · AI<br>`rss-the-verge-ai` | [列表](https://www.theverge.com/rss/ai-artificial-intelligence/index.xml) | 精选 | 2026-10-07 | 1 |
| TechCrunch · AI<br>`rss-techcrunch-ai` | [列表](https://techcrunch.com/category/artificial-intelligence/feed/) | 精选 | 2026-10-07 | 1 |
| Ars Technica · AI<br>`rss-ars-ai` | [列表](https://arstechnica.com/ai/feed/) | 精选 | 2026-10-07 | 1 |
| The Decoder<br>`rss-the-decoder` | [列表](https://the-decoder.com/feed/) | 精选 | 2026-10-07 | 4 |
| MIT Technology Review · AI<br>`rss-mit-tr-ai` | [列表](https://www.technologyreview.com/topic/artificial-intelligence/feed) | 精选 | 2026-10-05 | 1 |
| Cartoon Brew（动画工业·AI in animation）<br>`rss-cartoon-brew` | [列表](https://www.cartoonbrew.com/feed) | 精选 | 2026-10-06 | 1 |
| Reddit r/aivideo（视频生成社区）<br>`rss-reddit-aivideo` | [列表](https://www.reddit.com/r/aivideo/.rss) | 精选 | 2026-10-08 | 23 |
| No Film School<br>`rss-no-film-school` | [列表](https://nofilmschool.com/feeds/content-types/article.rss) | 精选 | 2026-10-07 | 3 |
| CineD<br>`rss-cined` | [列表](https://www.cined.com/feed/) | 精选 | 2026-10-07 | 1 |
| 80 Level<br>`rss-80lv` | [列表](https://80.lv/feed) | 精选 | 2026-10-08 | 1 |
| befores & afters<br>`rss-befores-afters` | [列表](https://beforesandafters.com/feed/) | 精选 | 本次未匹配 | 0 |
| fxguide<br>`rss-fxguide` | [列表](https://www.fxguide.com/feed/) | 精选 | 2026-08-28 | 0 |
| VFX Voice<br>`rss-vfxvoice` | [列表](https://vfxvoice.com/feed/) | 精选 | 本次未匹配 | 0 |
| Animation Magazine<br>`rss-animation-magazine` | [列表](https://www.animationmagazine.net/feed/) | 精选 | 本次未匹配 | 0 |
| ProVideo Coalition<br>`rss-provideo-coalition` | [列表](https://www.provideocoalition.com/feed/) | 精选 | 2026-10-06 | 2 |
| RedShark News<br>`rss-redshark` | [列表](https://www.redsharknews.com/rss.xml) | 精选 | 2026-10-06 | 2 |
| Videomaker<br>`rss-videomaker` | [列表](https://www.videomaker.com/feed/) | 精选 | 2026-09-24 | 1 |
| Variety · AI<br>`rss-variety-ai` | [列表](https://variety.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-25 | 1 |
| Deadline · AI<br>`rss-deadline-ai` | [列表](https://deadline.com/tag/artificial-intelligence/feed/) | 精选 | 2026-10-02 | 6 |
| The Hollywood Reporter · AI<br>`rss-hollywood-reporter-ai` | [列表](https://www.hollywoodreporter.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-28 | 1 |
| IndieWire · AI<br>`rss-indiewire-ai` | [列表](https://www.indiewire.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-19 | 1 |
| Fstoppers<br>`rss-fstoppers` | [列表](https://fstoppers.com/feed) | 精选 | 2026-10-06 | 2 |
| DIYPhotography<br>`rss-diy-photography` | [列表](https://www.diyphotography.net/feed/) | 精选 | 本次未匹配 | 0 |
| Creative Bloq<br>`rss-creative-bloq` | [列表](https://www.creativebloq.com/feeds.xml) | 精选 | 2026-10-08 | 2 |
| Digital Camera World<br>`rss-digital-camera-world` | [列表](https://www.digitalcameraworld.com/feeds.xml) | 精选 | 2026-10-07 | 1 |
| 量子位<br>`rss-qbitai` | [列表](https://www.qbitai.com/feed) | 精选 | 2026-10-07 | 1 |
| IT之家<br>`rss-ithome` | [列表](https://www.ithome.com/rss/) | 精选 | 2026-10-08 | 13 |
| 极客公园<br>`rss-geekpark` | [列表](https://www.geekpark.net/rss) | 精选 | 2026-10-08 | 20 |
| 少数派<br>`rss-sspai` | [列表](https://sspai.com/feed) | 精选 | 本次未匹配 | 0 |
| 雷峰网<br>`rss-leiphone` | [列表](https://www.leiphone.com/feed) | 精选 | 2026-10-07 | 5 |
| postPerspective<br>`rss-postperspective` | [列表](https://postperspective.com/feed/) | 精选 | 2026-10-07 | 3 |
| Post Magazine<br>`rss-postmagazine` | [列表](https://www.postmagazine.com/feed/) | 精选 | 2026-09-09 | 1 |
| Filmmaker Magazine<br>`rss-filmmakermagazine` | [列表](https://filmmakermagazine.com/feed/) | 精选 | 2026-06-17 | 0 |
| Filmmakers Academy<br>`rss-filmmakersacademy` | [列表](https://www.filmmakersacademy.com/feed/) | 精选 | 2026-10-08 | 2 |
| Creative Review<br>`rss-creative-review` | [列表](https://www.creativereview.co.uk/feed/) | 精选 | 2026-10-05 | 1 |
| CG Channel<br>`rss-cgchannel` | [列表](https://www.cgchannel.com/feed/) | 精选 | 2026-10-06 | 2 |
| CGPress<br>`rss-cgpress` | [列表](https://cgpress.org/feed) | 精选 | 2026-10-06 | 2 |
| BlenderNation<br>`rss-blendernation` | [列表](https://www.blendernation.com/feed/) | 精选 | 2026-10-08 | 2 |
| Blender Artists<br>`rss-blenderartists` | [列表](https://blenderartists.org/latest.rss) | 精选 | 2026-10-07 | 2 |
| Production Expert<br>`rss-productionexpert` | [列表](https://www.production-expert.com/production-expert-1?format=rss) | 精选 | 2026-10-07 | 3 |
| Rekkerd<br>`rss-rekkerd` | [列表](https://rekkerd.org/feed/) | 精选 | 2026-10-07 | 7 |
| CDM<br>`rss-cdm` | [列表](https://cdm.link/feed/) | 精选 | 2026-09-27 | 1 |
| MusicRadar<br>`rss-musicradar` | [列表](https://www.musicradar.com/feeds.xml) | 精选 | 2026-10-06 | 2 |
| Music Business Worldwide<br>`rss-musicbusinessworldwide` | [列表](https://www.musicbusinessworldwide.com/feed/) | 精选 | 2026-10-07 | 3 |
| PetaPixel<br>`rss-petapixel` | [列表](https://petapixel.com/feed/) | 精选 | 2026-10-07 | 4 |

## 短剧、漫剧与竖屏剧产业（69）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期（UTC） | 本次近 30 天 |
|---|---|---|---|---:|
| The Hollywood Reporter · 微短剧<br>`rss-hollywood-microdramas` | [列表](https://www.hollywoodreporter.com/t/microdramas/feed/) | 精选 | 2026-07-24 | 0 |
| Variety · 微短剧<br>`rss-variety-microdramas` | [列表](https://variety.com/t/microdramas/feed/) | 精选 | 2026-09-29 | 2 |
| Deadline · 微短剧<br>`rss-deadline-microdramas` | [列表](https://deadline.com/tag/microdramas/feed/) | 精选 | 2026-07-23 | 0 |
| Streaming Radar · 竖屏剧产业简报<br>`rss-streaming-radar` | [列表](https://www.streaming-radar.com/feed) | 精选 | 2026-10-08 | 5 |
| Vertical Drama · 竖屏剧行业新闻<br>`rss-verticaldrama-news` | [列表](https://www.verticaldrama.tv/feed.xml) | 精选 | 2026-10-08 | 5 |
| World Screen · 微短剧<br>`rss-worldscreen-microdramas` | [列表](https://worldscreen.com/?s=microdrama&feed=rss2) | 精选 | 2026-03-05 | 0 |
| VideoWeek · 微短剧<br>`rss-videoweek-microdramas` | [列表](https://videoweek.com/?s=microdrama&feed=rss2) | 精选 | 2026-05-08 | 0 |
| Advanced Television · 微短剧<br>`rss-advancedtv-microdramas` | [列表](https://advanced-television.com/?s=microdrama&feed=rss2) | 精选 | 2026-09-07 | 0 |
| 快手 · 公司公告与 AI 内容业务<br>`rss-kuaishou-company-news` | [列表](https://ir.kuaishou.com/rss/news-releases.xml) | 精选 | 2026-07-21 | 0 |
| 爱奇艺 · 官方新闻与 AI 制作<br>`rss-iqiyi-company-news` | [列表](https://ir.iqiyi.com/rss/news-releases.xml) | 精选 | 2026-09-23 | 1 |
| Tubefilter · 微短剧<br>`rss-tubefilter-microdramas` | [列表](https://www.tubefilter.com/?s=microdrama&feed=rss2) | 精选 | 2026-09-24 | 2 |
| DataEye 微短剧与漫剧公开报告<br>`web-dataeye-reports` | [列表](https://www.dataeye.com/media-center.html) | 精选 | 2026-08-02 | 0 |
| 短剧自习室 · 文章<br>`web-duanju007-posts` | [列表](https://duanju007.com/posts) | 精选 | 2026-10-02 | 7 |
| 国家广电总局 · 公告公示<br>`web-nrta-notices` | [列表](https://www.nrta.gov.cn/col/col113/index.html) | 精选 | 2026-09-30 | 1 |
| 广东省广电局 · 通知公告<br>`web-guangdong-notices` | [列表](https://gbdsj.gd.gov.cn/zxzx/tzgg/) | 精选 | 2026-06-10 | 0 |
| 广东省广电局 · 行业动态<br>`web-guangdong-industry` | [列表](https://gbdsj.gd.gov.cn/zxzx/hydt/) | 精选 | 2026-10-04 | 3 |
| 中文在线 · 官方新闻<br>`web-col-news` | [列表](https://www.col.com/list-e6jni41m/guanfangxinwen/2/10) | 精选 | 2026-07-29 | 0 |
| Crazy Maple Studio / ReelShort · 媒体报道<br>`web-crazy-maple-news` | [列表](https://crazymaplestudios.com/maple-news) | 精选 | 2026-08-27 | 0 |
| Vertical Story Fest · 竖屏剧行业简报<br>`web-vertical-story` | [列表](https://verticalstoryfest.com/) | 精选 | 2026-10-08 | 6 |
| 阅文集团 · 媒体报道<br>`web-yuewen-news` | [列表](https://www.yuewen.com/news) | 精选 | 2026-08-10 | 0 |
| 新腕儿 · 短剧与漫剧行业报道<br>`web-xinwanr` | [列表](https://www.xinwanr.com/news_list_index) | 精选 | 2026-09-30 | 1 |
| HOLYWATER TECH / My Drama · 公开新闻<br>`web-holywater-news` | [列表](https://www.holywater.tech/blog) | 精选 | 2026-09-02 | 0 |
| 传媒内参 · 搜狐公开专栏<br>`json-sohu-chuanmeineican` | [列表](https://m.sohu.com/media/351788) | 精选 | 2026-10-08 | 7 |
| 短剧自习室 · 搜狐公开专栏<br>`json-sohu-duanju007` | [列表](https://m.sohu.com/media/121864780) | 精选 | 2026-10-08 | 8 |
| DataEye数据 · 搜狐公开专栏<br>`json-sohu-dataeye` | [列表](https://m.sohu.com/media/120362942) | 精选 | 2026-10-09 | 6 |
| 毒眸 · 搜狐公开专栏<br>`json-sohu-dumou` | [列表](https://m.sohu.com/media/100240657) | 精选 | 2026-10-08 | 4 |
| 娱乐资本论 · 搜狐公开专栏<br>`json-sohu-entcapital` | [列表](https://m.sohu.com/media/159592) | 精选 | 2026-10-08 | 4 |
| 壹娱观察 · 搜狐公开专栏<br>`json-sohu-yiyu` | [列表](https://m.sohu.com/media/477902) | 精选 | 2026-10-02 | 4 |
| 深响 · 搜狐公开专栏<br>`json-sohu-shenxiang` | [列表](https://m.sohu.com/media/100194960) | 精选 | 2026-09-28 | 1 |
| 娱乐独角兽 · 搜狐公开专栏<br>`json-sohu-entunicorn` | [列表](https://m.sohu.com/media/549401) | 精选 | 2026-09-30 | 1 |
| 新榜 · 短剧与 AI 内容行业报道<br>`json-newrank-news` | [列表](https://www.newrank.cn/article) | 精选 | 2026-09-30 | 2 |
| 影视独舌 · 搜狐公开专栏<br>`json-sohu-yingshidushe` | [列表](https://m.sohu.com/media/116162) | 精选 | 2026-10-08 | 2 |
| 镜像娱乐 · 搜狐公开专栏<br>`json-sohu-jingxiang` | [列表](https://m.sohu.com/media/305277) | 精选 | 2026-09-29 | 1 |
| 读娱官网 · 搜狐公开专栏<br>`json-sohu-duyu` | [列表](https://m.sohu.com/media/523234) | 精选 | 2026-09-30 | 1 |
| 编剧帮 · 搜狐公开专栏<br>`json-sohu-bianjubang` | [列表](https://m.sohu.com/media/154166) | 精选 | 2026-07-31 | 0 |

### 本轮继续扩展（21）

| 信源 / ID | 公开入口 | 参与方式 | 最近匹配日期（UTC） | 近 30 天条目 |
|---|---|---|---|---:|
| 娱乐硬糖 · 搜狐公开专栏<br>`json-sohu-yingtang` | [列表](https://m.sohu.com/media/482286) | 精选 | 2026-10-09 | 1 |
| 文娱价值官 · 搜狐公开专栏<br>`json-sohu-wenyu-value` | [列表](https://m.sohu.com/media/99997725) | 精选 | 2026-10-08 | 6 |
| Tech星球 · 搜狐公开专栏<br>`json-sohu-techplanet` | [列表](https://m.sohu.com/media/120073179) | 精选 | 2026-10-07 | 1 |
| Behind the Verticals · 竖屏剧制作简报<br>`rss-behind-verticals` | [列表](https://www.behindtheverticals.com/feed) | 精选 | 2026-10-06 | 4 |
| Digiday · 微短剧营销与商业<br>`rss-digiday-microdramas` | [列表](https://digiday.com/?s=microdrama&feed=rss2) | 精选 | 2026-09-23 | 1 |
| AnimationXpress · 微短剧产业<br>`rss-animationxpress-microdramas` | [列表](https://animationxpress.com/?s=microdrama&feed=rss2) | 精选 | 2026-09-29 | 1 |
| TodoTV News · 微短剧产业<br>`rss-todotv-microdramas` | [列表](https://todotvnews.com/en/?s=microdrama&feed=rss2) | 精选 | 2026-09-29 | 1 |
| PRODU · 微短剧产业<br>`rss-produ-microdramas` | [列表](https://www.produ.com/?s=microdrama&feed=rss2) | 精选 | 2026-10-08 | 9 |
| 东西文娱 · 搜狐公开专栏<br>`json-sohu-dongxi` | [列表](https://m.sohu.com/media/100180909) | 精选 | 2026-09-18 | 1 |
| 国家广电总局 · 工作动态<br>`web-nrta-industry` | [列表](https://www.nrta.gov.cn/col/col114/index.html) | 精选 | 2026-09-30 | 3 |
| 上海文旅局 · 广播电视<br>`web-shanghai-tv` | [列表](https://whlyj.sh.gov.cn/gbds/index.html) | 精选 | 2026-09-30 | 3 |
| 江苏省广电局 · 省局动态<br>`web-jiangsu-industry` | [列表](https://jsgd.jiangsu.gov.cn/col/col69981/index.html) | 精选 | 2026-09-24 | 2 |
| 江苏省广电局 · 通知公告<br>`web-jiangsu-notices` | [列表](https://jsgd.jiangsu.gov.cn/col/col91594/index.html) | 精选 | 2026-05-29 | 0 |
| TheWrap · 微短剧产业<br>`rss-thewrap-microdramas` | [列表](https://www.thewrap.com/?s=microdrama&feed=rss2) | 精选 | 2026-10-02 | 3 |
| Applabs · 微短剧移动广告研究<br>`rss-applabs-microdramas` | [列表](https://blog.applabs.ai/feed/) | 精选 | 2026-09-09 | 1 |
| 短剧内行人 · 搜狐公开专栏<br>`json-sohu-neihang` | [列表](https://m.sohu.com/media/122642385) | 精选 | 2026-10-08 | 16 |
| 福建省广电局 · 通知公告<br>`web-fujian-notices` | [列表](https://gdj.fujian.gov.cn/gkai/tzgg/) | 精选 | 2026-09-20 | 1 |
| 福建省广电局 · 省局工作<br>`web-fujian-work` | [列表](https://gdj.fujian.gov.cn/xw/sjgz/) | 精选 | 2026-09-29 | 2 |
| 福建省广电局 · 媒体报道<br>`web-fujian-industry` | [列表](https://gdj.fujian.gov.cn/xw/hydt/) | 精选 | 2026-09-29 | 2 |
| 陕西省广电局 · 省局要闻<br>`web-shaanxi-work` | [列表](https://gdj.shaanxi.gov.cn/xwzx/bmdt/sjyw/) | 精选 | 2026-09-30 | 6 |
| Morketing · 出海商业洞察<br>`web-morketing-outbound` | [列表](https://www.morketing.com/) | 精选 | 2026-09-01 | 0 |
| 影视产业观察 · 搜狐公开专栏<br>`json-sohu-yingshichanye` | [列表](https://m.sohu.com/media/100097343) | 精选 | 2026-10-02 | 1 |
| Open Gardens · 竖屏剧简报<br>`rss-opengardens-vertical` | [列表](https://www.enteropengardens.com/feed) | 精选 | 2026-10-09 | 5 |
| 湖南省广电局 · 通知公告<br>`web-hunan-notices` | [列表](https://gbdsj.hunan.gov.cn/gbdsj/xxgk/tzgg/newxxgklist_nochn.html) | 精选 | 2026-09-22 | 1 |
| 四川省广电局 · 公告公示<br>`web-sichuan-notices` | [列表](https://gdj.sc.gov.cn/scgdj/gggs/zfxxgklist.shtml) | 精选 | 2026-06-05 | 0 |
| 四川省广电局 · 行业动态<br>`web-sichuan-industry` | [列表](https://gdj.sc.gov.cn/scgdj/gdxw/list.shtml) | 精选 | 2026-08-11 | 0 |
| SocialPeta · 微短剧投放研究<br>`web-socialpeta-blog` | [列表](https://socialpeta.com/en/blog) | 精选 | 2026-09-30 | 4 |
| AppGrowing · 短剧投放研究<br>`rss-appgrowing-cn-feed` | [列表](https://appgrowing.net/blog/feed/) | 精选 | 2026-09-24 | 1 |
| 辽宁省广电局 · 通知公告<br>`web-liaoning-notices` | [列表](https://gdj.ln.gov.cn/gdj/index/tzgg/index.shtml) | 精选 | 2026-09-24 | 2 |
| 辽宁省广电局 · 行业动态<br>`web-liaoning-industry` | [列表](https://gdj.ln.gov.cn/gdj/index/xydt/index.shtml) | 精选 | 2026-09-28 | 1 |
| 湖南省广电局 · 省局与行业消息<br>`web-hunan-industry` | [列表](https://gbdsj.hunan.gov.cn/gbdsj/) | 精选 | 2026-10-09 | 1 |
| 番茄小说 · 短剧漫剧改编公告<br>`json-fanqie-author-notices` | [列表](https://fanqienovel.com/writer/zone/notice) | 精选 | 2026-09-29 | 3 |
| Vertical Observer · 竖屏剧产业报道<br>`json-vertical-observer-news` | [列表](https://verticalobserver.com/data/site.json) | 精选 | 2026-10-08 | 61 |
| Plot Party · 微短剧产业周报<br>`web-plotparty-news` | [列表](https://plotparty.ai/page/news) | 精选 | 2026-10-05 | 4 |
