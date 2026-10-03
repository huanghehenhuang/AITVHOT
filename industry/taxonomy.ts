// aitvhot 行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。
// 注意：本文件的 CATEGORY_TAGS / TOPIC_TAGS / ENTITY_TAGS 必须与 prompts/content-understanding.md 的白名单逐字一致。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉模型怎么归类。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 */
export const CATEGORIES = [
  { key: "video-model", label: "视频模型", section: "模型发布/更新", guide: "视频、图像、音频生成模型的发布、版本更新、能力边界变化与开放" },
  { key: "tool", label: "创作工具", section: "工具与工作流", guide: "AI 创作工具与平台：剪辑、配音、翻译、换脸、数字人、ComfyUI 工作流的发布和更新" },
  { key: "platform", label: "平台动态", section: "平台与监管", guide: "红果、抖音、快手等短剧平台的规则、分账、入口与审核变化" },
  { key: "policy", label: "监管政策", section: "平台与监管", guide: "微短剧备案与审核规定、AI 生成内容标识、版权与深度合成监管" },
  { key: "industry", label: "行业商业", section: "行业动态", guide: "融资并购、公司经营、人事、合作、版权诉讼与商业模式" },
  { key: "tip", label: "教程实践", section: "技巧与观点", guide: "工作流教程、工具评测、实操技巧与踩坑记录" },
  { key: "opinion", label: "观点趋势", section: "技巧与观点", guide: "行业观点、人物访谈、现象与趋势讨论" },
] as const;

/**
 * 内容理解一步给每篇资料判的“内容类型”（写在 prompts/content-understanding.md 里，改了类型要同步改那份提示词）。
 * 评分提示词（prompts/selection-score.md）按类型给五个维度不同的权重。
 * 【aitvhot 保持这 7 个 key 不变】：评分权重表与代码零改动，只改提示词里的类型描述。
 */
export const ITEM_TYPES = ["model_release", "product_launch", "tool_or_prompt", "research_paper", "industry_event", "opinion_analysis", "tutorial_explainer"] as const;

// ── 标签词表 ────────────────────────────────────────────────────────────────────────────

/** 每篇资料的第一个标签必须是这些“分类标签”之一。与 content-understanding.md 白名单逐字一致。 */
export const CATEGORY_TAGS = [
  "模型发布", "产品更新", "政策/监管", "平台动态", "行业动态", "教程/实践", "大佬观点", "现象/趋势", "评测/基准", "作品/案例", "论文/研究", "其他",
] as const;

/** 可选的主题标签。与 content-understanding.md 白名单逐字一致。 */
export const TOPIC_TAGS = [
  "视频生成", "图像生成", "AI配音/音频", "AI翻译出海", "数字人/换脸", "ComfyUI/工作流", "剧本/文本", "动画/3D", "音乐/音效", "虚拟拍摄", "端侧/实时", "出海/投放",
] as const;

/** 可选的实体标签（公司、机构、平台）。与 content-understanding.md 白名单逐字一致。 */
export const ENTITY_TAGS = ["OpenAI", "Google", "Runway", "Luma", "Pika", "Kling", "Jimeng", "Vidu", "MiniMax", "Suno", "ElevenLabs", "Midjourney", "腾讯", "阿里", "快手", "字节跳动", "Hugging Face", "GitHub", "arXiv"] as const;

/** 模型常写的近义词，统一成词表里的写法。 */
export const TAG_SYNONYMS: Readonly<Record<string, string>> = {
  "短剧资讯": "行业动态", "平台规则": "平台动态", "平台政策": "平台动态", 新规: "政策/监管", 备案: "政策/监管", 监管: "政策/监管", 法规: "政策/监管", 政策: "政策/监管",
  融资: "行业动态", 收购: "行业动态", 并购: "行业动态", 投资: "行业动态", 合作: "行业动态", 公司动态: "行业动态",
  模型: "模型发布", 发布: "模型发布", 开源: "模型发布", 仓库: "模型发布",
  产品: "产品更新", 更新: "产品更新", 功能: "产品更新",
  教程: "教程/实践", 技巧: "教程/实践", 工作流: "教程/实践", 指南: "教程/实践", 实操: "教程/实践",
  观点: "大佬观点", 评论: "大佬观点", 访谈: "大佬观点",
  趋势: "现象/趋势", 现象: "现象/趋势",
  评测: "评测/基准", 测评: "评测/基准",
  作品: "作品/案例", 案例: "作品/案例", 上线: "作品/案例",
  论文: "论文/研究", 研究: "论文/研究", paper: "论文/研究", papers: "论文/研究",
};

/** 模型漏了分类标签时，按内容类型补一个。 */
export const CATEGORY_BY_ITEM_TYPE: Readonly<Record<string, string>> = {
  model_release: "模型发布", product_launch: "产品更新", tool_or_prompt: "教程/实践", research_paper: "论文/研究",
  industry_event: "行业动态", opinion_analysis: "大佬观点", tutorial_explainer: "教程/实践",
};

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/** 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[] }> = {
  kling: { name: "可灵 Kling", displayTag: "Kling", aliases: ["可灵", "Kling", "Kling AI"] },
  jimeng: { name: "即梦 Jimeng", displayTag: "Jimeng", aliases: ["即梦", "Jimeng"] },
  vidu: { name: "Vidu（生数科技）", displayTag: "Vidu", aliases: ["Vidu", "生数科技", "生数"] },
  minimax: { name: "MiniMax / 海螺", displayTag: "MiniMax", aliases: ["MiniMax", "海螺", "Hailuo"] },
  openai: { name: "OpenAI / Sora", displayTag: "OpenAI", aliases: ["OpenAI", "Sora", "GPT", "ChatGPT"] },
  google: { name: "Google / Veo", displayTag: "Google", aliases: ["Google", "DeepMind", "Gemini", "Veo", "谷歌"] },
  runway: { name: "Runway", displayTag: "Runway", aliases: ["Runway"] },
  pika: { name: "Pika", displayTag: "Pika", aliases: ["Pika"] },
  luma: { name: "Luma", displayTag: "Luma", aliases: ["Luma", "Dream Machine"] },
  midjourney: { name: "Midjourney", displayTag: "Midjourney", aliases: ["Midjourney"] },
  elevenlabs: { name: "ElevenLabs", displayTag: "ElevenLabs", aliases: ["ElevenLabs", "Eleven Labs"] },
  suno: { name: "Suno", displayTag: "Suno", aliases: ["Suno"] },
  nrta: { name: "国家广电总局", displayTag: null, aliases: ["广电总局", "国家广播电视总局", "NRTA"] },
  hongguo: { name: "红果短剧", displayTag: null, aliases: ["红果", "红果短剧"] },
  dianzhong: { name: "点众科技", displayTag: null, aliases: ["点众", "点众科技"] },
  jiuzhou: { name: "九州文化", displayTag: null, aliases: ["九州", "九州文化"] },
  zhongwen: { name: "中文在线", displayTag: null, aliases: ["中文在线"] },
  yuewen: { name: "阅文集团", displayTag: null, aliases: ["阅文", "阅文集团"] },
  kuaishou: { name: "快手", displayTag: null, aliases: ["快手", "Kuaishou"] },
  bytedance: { name: "字节跳动", displayTag: null, aliases: ["字节跳动", "字节", "抖音集团"] },
  "alibaba-wan": { name: "通义万相（阿里）", displayTag: null, aliases: ["通义万相", "Wan", "万相"] },
  tencent: { name: "混元视频（腾讯）", displayTag: null, aliases: ["混元", "Hunyuan", "腾讯混元"] },
};

/**
 * 身份词典：摘要和标题里出现的公司，必须在原文里也出现过，否则退回原标题、丢掉摘要（防止模型张冠李戴）。
 * 【aitvhot 必须保留这个机制】：可灵/即梦/Vidu 同圈高频混淆，模型极易把厂商张冠李戴。
 */
export const IDENTITY_LEXICON: ReadonlyArray<{ id: string; name: string; patterns: RegExp[] }> = [
  { id: "kling", name: "可灵", patterns: [/可灵|kling/i] },
  { id: "jimeng", name: "即梦", patterns: [/即梦|jimeng/i] },
  { id: "vidu", name: "Vidu", patterns: [/\bvidu\b/i, /生数/] },
  { id: "minimax", name: "MiniMax / 海螺", patterns: [/minimax|海螺|hailuo/i] },
  { id: "openai", name: "OpenAI / Sora", patterns: [/openai|\bsora\b|chatgpt|\bgpt-?[o\d]/i] },
  { id: "google", name: "Google / Veo", patterns: [/google|deepmind|谷歌|\bveo\s?\d|\bgemini\b/i] },
  { id: "runway", name: "Runway", patterns: [/runway/i] },
  { id: "pika", name: "Pika", patterns: [/\bpika\b/i] },
  { id: "luma", name: "Luma", patterns: [/\bluma\b|dream machine/i] },
  { id: "midjourney", name: "Midjourney", patterns: [/midjourney/i] },
  { id: "elevenlabs", name: "ElevenLabs", patterns: [/eleven\s?labs/i] },
  { id: "suno", name: "Suno", patterns: [/\bsuno\b/i] },
  { id: "nrta", name: "广电总局", patterns: [/广电总局|国家广播电视总局|\bnrta\b/i] },
  { id: "hongguo", name: "红果短剧", patterns: [/红果/] },
  { id: "dianzhong", name: "点众科技", patterns: [/点众/] },
  { id: "jiuzhou", name: "九州文化", patterns: [/九州/] },
  { id: "zhongwen", name: "中文在线", patterns: [/中文在线/] },
  { id: "yuewen", name: "阅文", patterns: [/阅文/] },
  { id: "kuaishou", name: "快手", patterns: [/快手|kuaishou/i] },
  { id: "bytedance", name: "字节跳动", patterns: [/字节跳动|bytedance|抖音集团/i] },
  { id: "alibaba-wan", name: "通义万相", patterns: [/通义万相|wanx|\bwan-?2\b/i] },
  { id: "tencent", name: "混元视频", patterns: [/混元|hunyuan/i] },
];

/** 这些域名上的文章，发布方就是对应的公司（托管平台如 GitHub、arXiv 不算）。 */
export const PUBLISHER_DOMAINS: ReadonlyArray<{ entityId: string; domains: readonly string[] }> = [
  { entityId: "openai", domains: ["openai.com"] },
  { entityId: "google", domains: ["deepmind.google", "ai.google", "blog.google"] },
  { entityId: "runway", domains: ["runwayml.com"] },
  { entityId: "luma", domains: ["lumalabs.ai"] },
  { entityId: "midjourney", domains: ["midjourney.com"] },
  { entityId: "elevenlabs", domains: ["elevenlabs.io"] },
  { entityId: "suno", domains: ["suno.com"] },
  { entityId: "vidu", domains: ["vidu.com", "shengshu-ai.com"] },
  { entityId: "minimax", domains: ["minimax.io", "minimaxi.com"] },
  { entityId: "nrta", domains: ["nrta.gov.cn"] },
];

/** 原文里的这些写法也算提到了对应公司。 */
export const IDENTITY_CONTEXT_ALIASES: ReadonlyArray<{ entityId: string; pattern: RegExp }> = [
  { entityId: "kling", pattern: /@Kling_AI\b/i },
  { entityId: "jimeng", pattern: /@jimeng_ai\b/i },
  { entityId: "vidu", pattern: /@ViduTechnology\b/i },
];
