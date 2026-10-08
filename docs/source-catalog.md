# AI 影视信源清单

验证日期：2026-10-08。配置从上一轮 23 个扩到 **122 个**，本轮新增 99 个；相对当前 main 的 12 个基础源共增加 110 个。不包含仅在线上数据库里的 X、公众号或其他手工来源。

| 类型 | 入口数 |
|---|---:|
| RSS / Atom | 76 |
| 普通 HTML 列表 | 11 |
| 公开 JSON / HTML 内嵌 JSON | 35 |

107 个入口进入原有精选流程，15 个开源版本更新入口仅作热度证据。热度证据也可能产生向量与归组费用。来源身份按 `owner_entity_id` 共归并为 99 组；122 是订阅、作者模型库和公告列表的数量，不是 122 家独立公司或网站。

## 验证范围与当前产出

逐个读取公开 HTTP 响应，再把保存的响应交给仓库现有 RSS、HTML 和 JSON 采集器验证。122 个列表均可解析出非空条目；经过来源关键词与格式过滤后，116 个本次有匹配内容，6 个本次没有匹配内容。71 个本次列表含近 30 天的匹配条目，其他来源保留监测新发布，其旧资料不回灌。

这些是一次列表快照，不是线上采集成功率、日均产量或实际入选率。下表的近期条目数在来源内统计，尚未跨 URL、来源与事件去重；正文提取与模型筛选仍由后续流程决定。已选入口的匹配条目均有可解析日期。

验证结果与响应 SHA-256 见 [source-checks.json](source-checks.json)。可复查配置或显式联网检查：

```bash
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts
MODEL_CALLS_ENABLED=false COLLECT_ENABLED=false node scripts/check-sources.ts --live
```

第二条命令只读取公开列表，不入库、不抓正文、不启动 worker、不调用模型或 X/公众号付费 API。列表有条目但当前没有主题匹配时记为提示，抓取或解析失败才返回失败；代码测试使用本地样本，不访问外网。

## 接入与成本约束

- 全部基础配置限制 30 天有日期历史，首轮最多 3 条；旧源在已有数据库中的配置仍由 seed 保留。没有日期的未来条目依原规则保留，需从检查结果关注。
- 宽泛 AI 媒体先按影视关键词过滤，影视媒体先按 AI 关键词过滤。规则只作用于配置了 `requireMarkers` 的源，过滤在详情补齐、入库和模型调用前完成。
- 一个 Hugging Face 作者只配一个模型列表，按 `createdAt` 读取新模型仓库，不将权重文件、提交或修改时间算成新发布。过滤常见 Diffusers 转换、GGUF、FP8 等重复格式；IndexTeam 保留指定的完整精度原生语音模型。
- Hugging Face 作者模型列表中，Step、腾讯混元、NVIDIA Cosmos、Microsoft TRELLIS、Meta SAM 和智谱图像已收窄查询或使用标题范围，避免大量文本模型挤掉创作模型。
- 同一厂商的官网、模型列表与发布日志共用来源身份，例如 Comfy、Google、字节、阿里、腾讯和 Lightricks，避免当成多家机构重复贡献热度。
- RSS 沿用条件请求与 URL 判重，普通 HTML / JSON 直接读取，不配置 Jina；全文展示和全文分发均关闭。
- 列表采集不需要按次付费 API；正文补齐、精选、写作、向量和事件归组仍可能花费。评分门槛、模型选择及预算额度未改变，上线后从「产出与成本」核对实际效果。

Runway 列表在 Next.js Flight 的 `posts` 数组中；已修复原解析器遇到条目内嵌套数组就截断的问题。MiniMax 官网使用同一 `publishDate` 字段返回毫秒数字和 ISO 字符串，使用显式混合日期单位。字节 Seed 使用官网的公开文章列表与 `ArticleMeta.PublishDate`，避免把置顶旧文的更新日期当成新发布。LTX Studio 入口已迁移至 `ltx.io`，Captions 列表使用 `captions.ai` 的实际地址。

## 未纳入的入口

空的 Wan2GP、ComfyUI-WanVideoWrapper、Qwen3-TTS/ASR Releases；仅有很旧发布的 HunyuanVideo、FramePack、GPT-SoVITS、CosyVoice 等 Releases；返回错误页的 Substack / YouTube RSS、404、403、无法解析的页面均未作为新增有效入口。Genmo、Bark 等长期没有新模型创建的作者列表也未加入。它们仍可能有活跃产品或代码，需要另找可靠公告渠道，不能从空订阅推断项目停止更新。

新来源名单仍需要运营校验精选质量；账号、接口和网页结构都可能变化。已有站点的导入、别名重复与费用口径见 [source-operations.md](source-operations.md)。

## 官方公告与产品博客（31）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| OpenAI News<br>`rss-openai-news` | [列表](https://openai.com/news/rss.xml) | 精选 | 2026-10-07 | 74 |
| Google AI Blog（Veo 发布渠道）<br>`rss-google-ai-blog` | [列表](https://blog.google/technology/ai/rss/) | 精选 | 2026-10-07 | 16 |
| Google DeepMind<br>`rss-deepmind` | [列表](https://deepmind.google/blog/rss.xml) | 精选 | 2026-10-06 | 8 |
| Hugging Face Blog（开源视频模型常首发于此）<br>`rss-hugging-face` | [列表](https://huggingface.co/blog/feed.xml) | 精选 | 2026-10-07 | 16 |
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

## 开源软件发布（27）

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

## 创作者与教程（3）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| Curious Refuge 创作教程<br>`rss-curious-refuge` | [列表](https://curiousrefuge.com/blog?format=rss) | 精选 | 2026-10-02 | 9 |
| Latent Space<br>`rss-latentspace` | [列表](https://www.latent.space/feed) | 精选 | 2026-09-29 | 3 |
| Stable Diffusion Art 教程<br>`rss-stable-diffusion-art` | [列表](https://stable-diffusion-art.com/feed/) | 精选 | 2026-03-02 | 0 |

## 媒体与社区（30）

| 信源 / ID | 入口 | 参与方式 | 最近匹配日期 | 本次近 30 天 |
|---|---|---|---|---:|
| The Verge · AI<br>`rss-the-verge-ai` | [列表](https://www.theverge.com/rss/ai-artificial-intelligence/index.xml) | 精选 | 2026-10-07 | 10 |
| TechCrunch · AI<br>`rss-techcrunch-ai` | [列表](https://techcrunch.com/category/artificial-intelligence/feed/) | 精选 | 2026-10-07 | 20 |
| Ars Technica · AI<br>`rss-ars-ai` | [列表](https://arstechnica.com/ai/feed/) | 精选 | 2026-10-08 | 20 |
| The Decoder<br>`rss-the-decoder` | [列表](https://the-decoder.com/feed/) | 精选 | 2026-10-07 | 10 |
| MIT Technology Review · AI<br>`rss-mit-tr-ai` | [列表](https://www.technologyreview.com/topic/artificial-intelligence/feed) | 精选 | 2026-10-05 | 10 |
| Cartoon Brew（动画工业·AI in animation）<br>`rss-cartoon-brew` | [列表](https://www.cartoonbrew.com/feed) | 精选 | 2026-10-07 | 20 |
| Reddit r/aivideo（视频生成社区）<br>`rss-reddit-aivideo` | [列表](https://www.reddit.com/r/aivideo/.rss) | 精选 | 2026-10-08 | 23 |
| No Film School<br>`rss-no-film-school` | [列表](https://nofilmschool.com/feeds/content-types/article.rss) | 精选 | 2026-10-07 | 30 |
| CineD<br>`rss-cined` | [列表](https://www.cined.com/feed/) | 精选 | 2026-10-07 | 3 |
| 80 Level<br>`rss-80lv` | [列表](https://80.lv/feed) | 精选 | 2026-10-07 | 2 |
| befores & afters<br>`rss-befores-afters` | [列表](https://beforesandafters.com/feed/) | 精选 | 2026-10-07 | 1 |
| fxguide<br>`rss-fxguide` | [列表](https://www.fxguide.com/feed/) | 精选 | 2026-10-06 | 1 |
| VFX Voice<br>`rss-vfxvoice` | [列表](https://vfxvoice.com/feed/) | 精选 | 本次未匹配 | 0 |
| Animation Magazine<br>`rss-animation-magazine` | [列表](https://www.animationmagazine.net/feed/) | 精选 | 2026-10-07 | 8 |
| ProVideo Coalition<br>`rss-provideo-coalition` | [列表](https://www.provideocoalition.com/feed/) | 精选 | 2026-10-06 | 2 |
| RedShark News<br>`rss-redshark` | [列表](https://www.redsharknews.com/rss.xml) | 精选 | 2026-10-06 | 2 |
| Videomaker<br>`rss-videomaker` | [列表](https://www.videomaker.com/feed/) | 精选 | 2026-09-24 | 1 |
| Variety · AI<br>`rss-variety-ai` | [列表](https://variety.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-25 | 1 |
| Deadline · AI<br>`rss-deadline-ai` | [列表](https://deadline.com/tag/artificial-intelligence/feed/) | 精选 | 2026-10-02 | 6 |
| The Hollywood Reporter · AI<br>`rss-hollywood-reporter-ai` | [列表](https://www.hollywoodreporter.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-28 | 1 |
| IndieWire · AI<br>`rss-indiewire-ai` | [列表](https://www.indiewire.com/t/artificial-intelligence/feed/) | 精选 | 2026-09-19 | 1 |
| Fstoppers<br>`rss-fstoppers` | [列表](https://fstoppers.com/feed) | 精选 | 2026-10-06 | 3 |
| DIYPhotography<br>`rss-diy-photography` | [列表](https://www.diyphotography.net/feed/) | 精选 | 本次未匹配 | 0 |
| Creative Bloq<br>`rss-creative-bloq` | [列表](https://www.creativebloq.com/feeds.xml) | 精选 | 2026-10-07 | 3 |
| Digital Camera World<br>`rss-digital-camera-world` | [列表](https://www.digitalcameraworld.com/feeds.xml) | 精选 | 2026-10-07 | 1 |
| 量子位<br>`rss-qbitai` | [列表](https://www.qbitai.com/feed) | 精选 | 2026-10-07 | 1 |
| IT之家<br>`rss-ithome` | [列表](https://www.ithome.com/rss/) | 精选 | 2026-10-08 | 13 |
| 极客公园<br>`rss-geekpark` | [列表](https://www.geekpark.net/rss) | 精选 | 2026-10-08 | 20 |
| 少数派<br>`rss-sspai` | [列表](https://sspai.com/feed) | 精选 | 本次未匹配 | 0 |
| 雷峰网<br>`rss-leiphone` | [列表](https://www.leiphone.com/feed) | 精选 | 2026-10-07 | 5 |
