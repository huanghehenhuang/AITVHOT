// aitvhot 行业的分类体系：类别、标签词表、公司（主体）名录，以及防止张冠李戴的身份词典。
// 模型按这里的词表打标签，主题页（topics.json）按标签归类，筛选栏按类别分组。
// 换行业时：类别的 key 会出现在网址里（/all?category=…），上线后就不要再改；标签和名录可以随时增减。
// 注意：本文件的 CATEGORY_TAGS / TOPIC_TAGS / ENTITY_TAGS 必须与 prompts/content-understanding.md 的白名单逐字一致。

/**
 * 网页上的类别（筛选栏、卡片角标、RSS 分类订阅）。key 是网址和接口里的身份，上线后不要改。
 * section 是日报里的分节标题（几个类别可以共用一节，按这里的顺序排）；guide 告诉结构抽取模型这一类收什么、
 * 和相邻类别的边界在哪（总的归类原则写在 prompts/structure.md 里）。
 * commentary 标出评论类（教程、观点）：日报写过的事又有评论类的后续报道，只占一行快讯（报道它的信源够多时除外）。
 * 没归上类的资料在日报里放进第一个 key 为 industry 的类别所在的节（没有就放最后一节）。
 * feedLabel 是分类 RSS 标题里的名字（不写就用 label）。公开接口、RSS 和 MCP 里要把一类并进另一类发布，写在站点设置里（site/site.ts 的 PUBLIC_CATEGORIES）。
 */
export const CATEGORIES = [
  { key: "video-model", label: "视频模型", feedLabel: "AI 视频模型", section: "模型发布/更新", guide: "视频、图像、音频生成模型本身的发布、版本、权重开放、能力或价格变化，以及既有榜单上的模型成绩。单纯的作品演示归工具或教程，不能因为用了某模型就归模型。" },
  { key: "tool", label: "创作工具", feedLabel: "AI 创作工具", section: "工具与工作流", guide: "可使用的 AI 创作工具与平台：剪辑、配音、翻译、换脸、数字人、ComfyUI 工作流的发布和更新。重点是可使用的产品功能；只有做法没有工具的复盘归教程。" },
  { key: "platform", label: "平台动态", section: "平台与监管", guide: "红果、抖音、快手等短剧与内容平台的规则、分账、保底、流量入口与审核变化。平台自身的经营新闻归行业。" },
  { key: "policy", label: "监管政策", section: "平台与监管", guide: "微短剧备案与审核规定、AI 生成内容标识、版权与深度合成监管。平台自己定的规则归平台动态。" },
  { key: "industry", label: "行业商业", section: "行业动态", guide: "已发生的公司经营、融资并购、人事、合作、版权诉讼与商业模式事实。新闻由当事人发帖、带有态度，也不因此变成观点。" },
  { key: "tip", label: "教程实践", section: "技巧与观点", guide: "读者可以照着使用的工作流教程、工具评测、实操技巧与踩坑记录。重点是可复用的做法；单纯发布工具归创作工具，只有态度和预测而无做法归观点。", commentary: true },
  { key: "opinion", label: "观点趋势", section: "技巧与观点", guide: "行业观点、人物访谈、现象与趋势讨论。重点是作者的解释、判断、主张、预测或评论；讨论市场不自动归行业，作者是名人不自动归观点。", commentary: true },
] as const satisfies ReadonlyArray<{ key: string; label: string; feedLabel?: string; section: string; guide: string; commentary?: true }>;

/**
 * 这个行业最受关注的一类发布（AI 短剧是新视频模型）：日报报头的“N 个新模型”、改分类后修订已出的报告都按它数。
 * category 是类别，tag 是标签，两者都对上才算；unit 接在数字后面。
 * 没有这样一类的行业设成 null，报头就不显示这个数。
 */
export const RELEASE: { category: string; tag: string; unit: string } | null = { category: "video-model", tag: "模型发布", unit: "个新模型" };

/** 周报月报的总述可以直接写、不必在报道里找到出处的行业通用词（小写）。站名会自动算进去。 */
export const PLAIN_TERMS: readonly string[] = ["ai", "aigc", "api", "llm", "gpu", "agi", "ceo", "ipo", "app"];

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

// ── 公司与主体 ──────────────────────────────────────────────────────────────────────────

/**
 * 公司主题：id → 显示名、卡片上显示的标签（null 表示只用 entity:<id> 归类）、别名。
 * aliases 给结构抽取模型看；otherNames 是公司自己的其他称呼（官方账号名、子品牌），
 * 把事实的主体对到发布方时也认它们。
 */
export const ENTITIES: Record<string, { name: string; displayTag: string | null; aliases: string[]; otherNames?: string[] }> = {
  kling: { name: "可灵 Kling", displayTag: "Kling", aliases: ["可灵", "Kling", "Kling AI"], otherNames: ["快手可灵"] },
  jimeng: { name: "即梦 Jimeng", displayTag: "Jimeng", aliases: ["即梦", "Jimeng"] },
  vidu: { name: "Vidu（生数科技）", displayTag: "Vidu", aliases: ["Vidu", "生数科技", "生数"] },
  minimax: { name: "MiniMax / 海螺", displayTag: "MiniMax", aliases: ["MiniMax", "海螺", "Hailuo"] },
  openai: { name: "OpenAI / Sora", displayTag: "OpenAI", aliases: ["OpenAI", "Sora", "GPT", "ChatGPT"] },
  google: { name: "Google / Veo", displayTag: "Google", aliases: ["Google", "DeepMind", "Gemini", "Veo", "谷歌"], otherNames: ["Google DeepMind", "Google Research"] },
  runway: { name: "Runway", displayTag: "Runway", aliases: ["Runway"] },
  pika: { name: "Pika", displayTag: "Pika", aliases: ["Pika"] },
  luma: { name: "Luma", displayTag: "Luma", aliases: ["Luma", "Dream Machine"] },
  midjourney: { name: "Midjourney", displayTag: "Midjourney", aliases: ["Midjourney"] },
  elevenlabs: { name: "ElevenLabs", displayTag: "ElevenLabs", aliases: ["ElevenLabs", "Eleven Labs"] },
  suno: { name: "Suno", displayTag: "Suno", aliases: ["Suno"] },
  nrta: { name: "国家广电总局", displayTag: null, aliases: ["广电总局", "国家广播电视总局", "NRTA"] },
  hongguo: { name: "红果短剧", displayTag: null, aliases: ["红果", "红果短剧"], otherNames: ["红果短剧APP"] },
  dianzhong: { name: "点众科技", displayTag: null, aliases: ["点众", "点众科技"] },
  jiuzhou: { name: "九州文化", displayTag: null, aliases: ["九州", "九州文化"] },
  zhongwen: { name: "中文在线", displayTag: null, aliases: ["中文在线"] },
  yuewen: { name: "阅文集团", displayTag: null, aliases: ["阅文", "阅文集团"] },
  kuaishou: { name: "快手", displayTag: null, aliases: ["快手", "Kuaishou"] },
  bytedance: { name: "字节跳动", displayTag: null, aliases: ["字节跳动", "字节", "抖音集团"], otherNames: ["抖音"] },
  "alibaba-wan": { name: "通义万相（阿里）", displayTag: null, aliases: ["通义万相", "Wan", "万相"] },
  tencent: { name: "混元视频（腾讯）", displayTag: null, aliases: ["混元", "Hunyuan", "腾讯混元"] },
};


// ── 清单注册表（231 源的 owner 归属；displayTag 为 null 表示只用 entity:<id> 归组、不进卡片标签）──
// 名称按 docs/source-catalog.md 的清单口径从源名称推导；人工核对的别名欢迎补充。
export const CATALOG_ENTITIES: Record<string, { name: string; displayTag: null; aliases: string[] }> = {
  "80lv": { name: "80 Level", displayTag: null, aliases: ["80 Level"] },
  "ace-step": { name: "ACE-Step", displayTag: null, aliases: ["ACE-Step"] },
  "acly": { name: "acly（krita-ai-diffusion）", displayTag: null, aliases: ["acly（krita-ai-diffusion）"] },
  "advancedtv": { name: "Advanced Television", displayTag: null, aliases: ["Advanced Television"] },
  "ai-for-real-life": { name: "AI For Real Life", displayTag: null, aliases: ["AI For Real Life"] },
  "aiography": { name: "AIography", displayTag: null, aliases: ["AIography"] },
  "alibaba": { name: "阿里巴巴（通义系）", displayTag: null, aliases: ["阿里巴巴（通义系）"] },
  "animation-magazine": { name: "Animation Magazine", displayTag: null, aliases: ["Animation Magazine"] },
  "animationxpress": { name: "AnimationXpress", displayTag: null, aliases: ["AnimationXpress"] },
  "appgrowing": { name: "AppGrowing", displayTag: null, aliases: ["AppGrowing"] },
  "applabs": { name: "Applabs", displayTag: null, aliases: ["Applabs"] },
  "apple": { name: "Apple Machine Learning Research", displayTag: null, aliases: ["Apple Machine Learning Research"] },
  "befores-afters": { name: "befores & afters", displayTag: null, aliases: ["befores & afters"] },
  "behind-the-verticals": { name: "Behind the Verticals", displayTag: null, aliases: ["Behind the Verticals"] },
  "bianjubang": { name: "编剧帮", displayTag: null, aliases: ["编剧帮"] },
  "black-forest-labs": { name: "Black Forest Labs", displayTag: null, aliases: ["Black Forest Labs"] },
  "blender": { name: "Blender 开发博客", displayTag: null, aliases: ["Blender 开发博客"] },
  "blenderartists": { name: "Blender Artists", displayTag: null, aliases: ["Blender Artists"] },
  "blendernation": { name: "BlenderNation", displayTag: null, aliases: ["BlenderNation"] },
  "bmaltais": { name: "bmaltais（kohya_ss）", displayTag: null, aliases: ["bmaltais（kohya_ss）"] },
  "canva": { name: "Canva", displayTag: null, aliases: ["Canva"] },
  "captions": { name: "Captions / Mirage", displayTag: null, aliases: ["Captions / Mirage"] },
  "cartesia": { name: "Cartesia", displayTag: null, aliases: ["Cartesia"] },
  "cdm": { name: "CDM", displayTag: null, aliases: ["CDM"] },
  "cgchannel": { name: "CG Channel", displayTag: null, aliases: ["CG Channel"] },
  "cgpress": { name: "CGPress", displayTag: null, aliases: ["CGPress"] },
  "chidiwilliams": { name: "chidiwilliams（buzz）", displayTag: null, aliases: ["chidiwilliams（buzz）"] },
  "chuanmeineican": { name: "传媒内参", displayTag: null, aliases: ["传媒内参"] },
  "cined": { name: "CineD", displayTag: null, aliases: ["CineD"] },
  "cnbeta": { name: "cnBeta", displayTag: null, aliases: ["cnBeta"] },
  "col": { name: "中文在线（COL）", displayTag: null, aliases: ["中文在线（COL）"] },
  "comfy": { name: "ComfyUI", displayTag: null, aliases: ["ComfyUI"] },
  "crazy-maple": { name: "Crazy Maple Studio（ReelShort）", displayTag: null, aliases: ["Crazy Maple Studio（ReelShort）"] },
  "creative-bloq": { name: "Creative Bloq", displayTag: null, aliases: ["Creative Bloq"] },
  "creative-review": { name: "Creative Review", displayTag: null, aliases: ["Creative Review"] },
  "curious-refuge": { name: "Curious Refuge", displayTag: null, aliases: ["Curious Refuge"] },
  "cv-public-account": { name: "我爱计算机视觉", displayTag: null, aliases: ["我爱计算机视觉"] },
  "dataeye": { name: "DataEye", displayTag: null, aliases: ["DataEye"] },
  "deadline": { name: "Deadline", displayTag: null, aliases: ["Deadline"] },
  "digiday": { name: "Digiday", displayTag: null, aliases: ["Digiday"] },
  "digital-camera-world": { name: "Digital Camera World", displayTag: null, aliases: ["Digital Camera World"] },
  "diy-photography": { name: "DIYPhotography", displayTag: null, aliases: ["DIYPhotography"] },
  "dongxi": { name: "东西文娱", displayTag: null, aliases: ["东西文娱"] },
  "duanju-neihang": { name: "短剧内行人", displayTag: null, aliases: ["短剧内行人"] },
  "duanju007": { name: "短剧自习室", displayTag: null, aliases: ["短剧自习室"] },
  "dumou": { name: "毒眸", displayTag: null, aliases: ["毒眸"] },
  "duyu": { name: "读娱官网", displayTag: null, aliases: ["读娱官网"] },
  "entcapital": { name: "娱乐资本论", displayTag: null, aliases: ["娱乐资本论"] },
  "entunicorn": { name: "娱乐独角兽", displayTag: null, aliases: ["娱乐独角兽"] },
  "epidemic": { name: "Epidemic Sound", displayTag: null, aliases: ["Epidemic Sound"] },
  "facefusion": { name: "facefusion", displayTag: null, aliases: ["facefusion"] },
  "fal": { name: "fal", displayTag: null, aliases: ["fal"] },
  "filmmakermagazine": { name: "Filmmaker Magazine", displayTag: null, aliases: ["Filmmaker Magazine"] },
  "filmmakersacademy": { name: "Filmmakers Academy", displayTag: null, aliases: ["Filmmakers Academy"] },
  "fishaudio": { name: "Fish Audio", displayTag: null, aliases: ["Fish Audio"] },
  "freepik": { name: "Freepik / Magnific", displayTag: null, aliases: ["Freepik / Magnific"] },
  "fstoppers": { name: "Fstoppers", displayTag: null, aliases: ["Fstoppers"] },
  "fujian-gdj": { name: "福建省广电局", displayTag: null, aliases: ["福建省广电局"] },
  "fxguide": { name: "fxguide", displayTag: null, aliases: ["fxguide"] },
  "geekpark": { name: "极客公园", displayTag: null, aliases: ["极客公园"] },
  "ggerganov": { name: "whisper.cpp", displayTag: null, aliases: ["whisper.cpp"] },
  "guangdong-gdj": { name: "广东省广电局", displayTag: null, aliases: ["广东省广电局"] },
  "hedra": { name: "Hedra", displayTag: null, aliases: ["Hedra"] },
  "heygen": { name: "HeyGen Updates", displayTag: null, aliases: ["HeyGen Updates"] },
  "hidream-ai": { name: "HiDream", displayTag: null, aliases: ["HiDream"] },
  "higgsfield": { name: "Higgsfield", displayTag: null, aliases: ["Higgsfield"] },
  "hollywood-reporter": { name: "The Hollywood Reporter", displayTag: null, aliases: ["The Hollywood Reporter"] },
  "holywater": { name: "HOLYWATER TECH / My Drama", displayTag: null, aliases: ["HOLYWATER TECH / My Drama"] },
  "huggingface": { name: "Diffusers", displayTag: null, aliases: ["Diffusers"] },
  "hunan-gdj": { name: "湖南省广电局", displayTag: null, aliases: ["湖南省广电局"] },
  "indexteam": { name: "IndexTTS", displayTag: null, aliases: ["IndexTTS"] },
  "indiewire": { name: "IndieWire", displayTag: null, aliases: ["IndieWire"] },
  "instantx": { name: "InstantX", displayTag: null, aliases: ["InstantX"] },
  "invokeai": { name: "InvokeAI", displayTag: null, aliases: ["InvokeAI"] },
  "iqiyi": { name: "爱奇艺", displayTag: null, aliases: ["爱奇艺"] },
  "ithome": { name: "IT之家", displayTag: null, aliases: ["IT之家"] },
  "jianchang512": { name: "pyvideotrans", displayTag: null, aliases: ["pyvideotrans"] },
  "jiangsu-gdj": { name: "江苏省广电局", displayTag: null, aliases: ["江苏省广电局"] },
  "jingxiang": { name: "镜像娱乐", displayTag: null, aliases: ["镜像娱乐"] },
  "jiqizhixin": { name: "机器之心SOTA模型", displayTag: null, aliases: ["机器之心SOTA模型"] },
  "kapwing": { name: "Kapwing 创作指南", displayTag: null, aliases: ["Kapwing 创作指南"] },
  "kohya-ss": { name: "sd-scripts", displayTag: null, aliases: ["sd-scripts"] },
  "krea": { name: "Krea", displayTag: null, aliases: ["Krea"] },
  "kyutai": { name: "Kyutai", displayTag: null, aliases: ["Kyutai"] },
  "lalal-ai": { name: "LALAL AI", displayTag: null, aliases: ["LALAL AI"] },
  "latentspace": { name: "Latent Space", displayTag: null, aliases: ["Latent Space"] },
  "leiphone": { name: "雷峰网", displayTag: null, aliases: ["雷峰网"] },
  "liaoning-gdj": { name: "辽宁省广电局", displayTag: null, aliases: ["辽宁省广电局"] },
  "lightricks": { name: "LTX Studio 创作与产品博客", displayTag: null, aliases: ["LTX Studio 创作与产品博客"] },
  "m-bain": { name: "whisperX", displayTag: null, aliases: ["whisperX"] },
  "mcmonkeyprojects": { name: "SwarmUI", displayTag: null, aliases: ["SwarmUI"] },
  "meituan-longcat": { name: "美团 LongCat", displayTag: null, aliases: ["美团 LongCat"] },
  "meta": { name: "Meta", displayTag: null, aliases: ["Meta"] },
  "microsoft": { name: "Microsoft", displayTag: null, aliases: ["Microsoft"] },
  "mifi": { name: "lossless-cut", displayTag: null, aliases: ["lossless-cut"] },
  "mltframework": { name: "shotcut", displayTag: null, aliases: ["shotcut"] },
  "morketing": { name: "Morketing", displayTag: null, aliases: ["Morketing"] },
  "mrnerf": { name: "LichtFeld-Studio", displayTag: null, aliases: ["LichtFeld-Studio"] },
  "musicbusinessworldwide": { name: "Music Business Worldwide", displayTag: null, aliases: ["Music Business Worldwide"] },
  "musicradar": { name: "MusicRadar", displayTag: null, aliases: ["MusicRadar"] },
  "newrank": { name: "新榜", displayTag: null, aliases: ["新榜"] },
  "nvidia": { name: "NVIDIA", displayTag: null, aliases: ["NVIDIA"] },
  "ohf-voice": { name: "piper1-gpl", displayTag: null, aliases: ["piper1-gpl"] },
  "open-gardens": { name: "Open Gardens", displayTag: null, aliases: ["Open Gardens"] },
  "openshot": { name: "openshot-qt", displayTag: null, aliases: ["openshot-qt"] },
  "oschina": { name: "开源中国", displayTag: null, aliases: ["开源中国"] },
  "petapixel": { name: "PetaPixel", displayTag: null, aliases: ["PetaPixel"] },
  "pixverse": { name: "PixVerse 中文", displayTag: null, aliases: ["PixVerse 中文"] },
  "plotparty": { name: "Plot Party", displayTag: null, aliases: ["Plot Party"] },
  "podcastle": { name: "Podcastle", displayTag: null, aliases: ["Podcastle"] },
  "postmagazine": { name: "Post Magazine", displayTag: null, aliases: ["Post Magazine"] },
  "postperspective": { name: "postPerspective", displayTag: null, aliases: ["postPerspective"] },
  "produ": { name: "PRODU", displayTag: null, aliases: ["PRODU"] },
  "productionexpert": { name: "Production Expert", displayTag: null, aliases: ["Production Expert"] },
  "provideo-coalition": { name: "ProVideo Coalition", displayTag: null, aliases: ["ProVideo Coalition"] },
  "qbitai": { name: "量子位", displayTag: null, aliases: ["量子位"] },
  "reallusion": { name: "Reallusion", displayTag: null, aliases: ["Reallusion"] },
  "recraft": { name: "Recraft", displayTag: null, aliases: ["Recraft"] },
  "redshark": { name: "RedShark News", displayTag: null, aliases: ["RedShark News"] },
  "rekkerd": { name: "Rekkerd", displayTag: null, aliases: ["Rekkerd"] },
  "replicate": { name: "Replicate", displayTag: null, aliases: ["Replicate"] },
  "resembleai": { name: "Resemble AI", displayTag: null, aliases: ["Resemble AI"] },
  "shaanxi-gdj": { name: "陕西省广电局", displayTag: null, aliases: ["陕西省广电局"] },
  "shakker-labs": { name: "Shakker Labs", displayTag: null, aliases: ["Shakker Labs"] },
  "shanghai-wlyj": { name: "上海文旅局", displayTag: null, aliases: ["上海文旅局"] },
  "shenxiang": { name: "深响", displayTag: null, aliases: ["深响"] },
  "sichuan-gdj": { name: "四川省广电局", displayTag: null, aliases: ["四川省广电局"] },
  "skywork": { name: "昆仑万维", displayTag: null, aliases: ["昆仑万维"] },
  "slop-reel": { name: "Slop Reel", displayTag: null, aliases: ["Slop Reel"] },
  "socialpeta": { name: "SocialPeta", displayTag: null, aliases: ["SocialPeta"] },
  "sspai": { name: "少数派", displayTag: null, aliases: ["少数派"] },
  "stabilityai": { name: "Stability AI", displayTag: null, aliases: ["Stability AI"] },
  "stable-diffusion-art": { name: "Stable Diffusion Art 教程", displayTag: null, aliases: ["Stable Diffusion Art 教程"] },
  "stepfun": { name: "阶跃StepFun", displayTag: null, aliases: ["阶跃StepFun"] },
  "stepfun-ai": { name: "阶跃星辰", displayTag: null, aliases: ["阶跃星辰"] },
  "streaming-radar": { name: "Vertical Drama", displayTag: null, aliases: ["Vertical Drama"] },
  "subtitleedit": { name: "subtitleedit", displayTag: null, aliases: ["subtitleedit"] },
  "swivid": { name: "F5-TTS", displayTag: null, aliases: ["F5-TTS"] },
  "systran": { name: "faster-whisper", displayTag: null, aliases: ["faster-whisper"] },
  "techplanet": { name: "Tech星球", displayTag: null, aliases: ["Tech星球"] },
  "theoretically": { name: "Theoretically Media", displayTag: null, aliases: ["Theoretically Media"] },
  "thewrap": { name: "TheWrap", displayTag: null, aliases: ["TheWrap"] },
  "tmtpost": { name: "钛媒体", displayTag: null, aliases: ["钛媒体"] },
  "todotvnews": { name: "TodoTV News", displayTag: null, aliases: ["TodoTV News"] },
  "tubefilter": { name: "Tubefilter", displayTag: null, aliases: ["Tubefilter"] },
  "unity": { name: "Unity", displayTag: null, aliases: ["Unity"] },
  "variety": { name: "Variety", displayTag: null, aliases: ["Variety"] },
  "vchitect": { name: "Vchitect", displayTag: null, aliases: ["Vchitect"] },
  "vertical-observer": { name: "Vertical Observer", displayTag: null, aliases: ["Vertical Observer"] },
  "vertical-story-fest": { name: "Vertical Story Fest", displayTag: null, aliases: ["Vertical Story Fest"] },
  "vfxvoice": { name: "VFX Voice", displayTag: null, aliases: ["VFX Voice"] },
  "videomaker": { name: "Videomaker", displayTag: null, aliases: ["Videomaker"] },
  "videoweek": { name: "VideoWeek", displayTag: null, aliases: ["VideoWeek"] },
  "vladmandic": { name: "sdnext", displayTag: null, aliases: ["sdnext"] },
  "wenyu-value": { name: "文娱价值官", displayTag: null, aliases: ["文娱价值官"] },
  "worldscreen": { name: "World Screen", displayTag: null, aliases: ["World Screen"] },
  "xinwanr": { name: "新腕儿", displayTag: null, aliases: ["新腕儿"] },
  "xinzhiyuan": { name: "新智元", displayTag: null, aliases: ["新智元"] },
  "yingshi-chanye": { name: "影视产业观察", displayTag: null, aliases: ["影视产业观察"] },
  "yingshidushe": { name: "影视独舌", displayTag: null, aliases: ["影视独舌"] },
  "yingtang": { name: "娱乐硬糖", displayTag: null, aliases: ["娱乐硬糖"] },
  "yiyu": { name: "壹娱观察", displayTag: null, aliases: ["壹娱观察"] },
  "zai-org": { name: "智谱（Z.ai）", displayTag: null, aliases: ["智谱", "Z.ai", "Zhipu"] },
  "zhidx": { name: "智东西", displayTag: null, aliases: ["智东西"] },
  "zyphra": { name: "Zyphra", displayTag: null, aliases: ["Zyphra"] },
};
Object.assign(ENTITIES, CATALOG_ENTITIES);

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
