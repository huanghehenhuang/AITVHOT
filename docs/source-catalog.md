# AI 影视信源清单

验证日期：2026-10-08。配置现有 **162 个入口**：从最初 23 个扩到 122 个，本轮再新增 40 个；相对当前 main 的 12 个基础源共增加 150 个。不包含仅在线上数据库中的 X、公众号付费账号或其他手工来源。

| 类型 | 入口数 |
|---|---:|
| RSS / Atom | 110 |
| 普通 HTML 列表 | 17 |
| 公开 JSON / HTML 内嵌 JSON | 35 |

147 个入口进入原有精选流程，15 个开源版本更新入口仅作热度证据。热度证据也可能产生向量与归组费用。来源身份按 `owner_entity_id` 共归并为 134 组；162 是入口数，134 是配置中的归属分组，均不等同于独立网站数。

## 本轮补充与验证口径

新增 40 个入口均能由仓库采集器解析出条目、匹配主题，并获得可解析日期；其中 37 个当前列表含近 30 天的匹配条目。补充 HeyGen、Luma、Reallusion、Apple 研究等一手入口，Theoretically Media、AIography、Slop Reel 等创作者，以及影视后期、音频、国内媒体和公开公众号 RSS。Theoretically Media 的博客与简报内容不同，沿用同一来源归属；Curious Refuge 的作品订阅也与其博客共用归属。

全库 162 个列表均有非空解析记录；154 个本次有匹配内容，8 个本次没有匹配内容。105 个列表含近 30 天匹配条目，其余继续监测新发布，明确有日期的旧资料不会进入新配置的回灌。所有匹配条目均有可解析日期。未改配置的来源沿用上轮 HTTP 捕获，改变范围的 31 个旧源和 40 个新源重新核验；逐条时间、最终跳转地址和响应 SHA-256 见 [source-checks.json](source-checks.json)。

这些是公开列表快照，不是线上采集成功率、日均产量或精选入选率。下表统计在来源内进行，尚未跨 URL、来源与事件去重；正文提取和模型筛选由后续流程决定。

```bash
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts --live
```

第二条命令显式联网，只读取公开列表，不入库、不抓正文、不启动 worker、不调用模型或 X/公众号付费 API。列表暂时没有主题匹配记为提示，抓取或解析失败才返回失败；自动测试使用本地样本，不访问外网。

## 采集与处理成本

- 全部基础配置限制 30 天有日期历史，首轮最多 3 条。没有日期的未来条目依原规则保留；已有数据库配置由 seed 保留。
- 宽泛 AI 媒体按影视关键词过滤，影视和音频媒体按 AI 关键词过滤；原先较宽的 OpenAI、Google、DeepMind、Hugging Face 和综合媒体示例也补上主题范围。过滤发生在详情补齐、入库和模型调用前。
- `requireMarkers` 保留字面子串匹配；短词 `AI`、`Udio` 使用 `requireWords` 整词检查，避免 `air`、`paid`、`audio` 等普通词误命中。关键词只是入口范围，最终重要性仍由原有精选流程决定。
- Hugging Face 每个作者只配一个列表，按 `createdAt` 监测新仓库；不将权重、提交或修改时间当成新发布。排除常见重复权重格式。
- 同一厂商的官网、模型列表、发布日志和公开公众号订阅共用来源身份，避免重复贡献热度。
- RSS 沿用条件请求和 URL 判重；HTML/JSON 直接读取，不配置 Jina。列表采集无需按次付费 API；正文、精选、写作、向量和归组仍可能产生费用。全文展示与分发均关闭，评分门槛、模型选择及预算额度未改变。

新增公众号入口中的 7 个由公开 RSS 桥接服务提供，配置标注「公共 RSS 桥接」，`first_party` 为 false；媒体按 T2，厂商账号按 T1_5，并归入对应厂商。它们依赖第三方转换服务，可能延迟、漏文或停用，不能视为官方 RSS 的可用性承诺，也不代表已免费接入全部公众号。

Runway 使用官网嵌套 Flight 数组，MiniMax 使用混合日期格式，字节 Seed 使用原始发布日；Luma 按官网新闻卡片取日期，排除 Blog 类 SEO 文章。创作者简报读取公开网页上的原始日期。入口可能发生官网跳转，实际最终地址见逐源记录。

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
| No Film School<br>`rss-no-film-school` | [列表](https://nofilmschool.com/feeds/content-types/article.rss) | 精选 | 2026-10-07 | 4 |
| CineD<br>`rss-cined` | [列表](https://www.cined.com/feed/) | 精选 | 2026-10-07 | 1 |
| 80 Level<br>`rss-80lv` | [列表](https://80.lv/feed) | 精选 | 2026-10-07 | 2 |
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
| Filmmakers Academy<br>`rss-filmmakersacademy` | [列表](https://www.filmmakersacademy.com/feed/) | 精选 | 2026-10-07 | 1 |
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
