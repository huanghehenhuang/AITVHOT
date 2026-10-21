import type { CategoryKey, ChannelKey } from "@aihot/contracts/taxonomy";
import { CATEGORY_LABELS, CHANNEL_LABELS } from "@aihot/contracts/taxonomy";
import type { Locale } from "./locale.ts";

const CATEGORY_EN: Record<CategoryKey, string> = {
  "video-model": "Video models",
  tool: "Tools",
  platform: "Platforms",
  policy: "Regulation",
  industry: "Industry",
  tip: "Tutorials",
  opinion: "Opinion",
};

const CHANNEL_EN: Record<ChannelKey, string> = {
  all: "All",
  news: "News",
  x: "X",
  firstParty: "First-hand",
};

/** Closed tag vocabularies from industry/taxonomy.ts. The query value stays the Chinese tag. */
const TAG_EN: Record<string, string> = {
  "模型发布": "Model release",
  "产品更新": "Product update",
  "政策/监管": "Policy",
  "平台动态": "Platforms",
  "行业动态": "Industry",
  "教程/实践": "Tutorial",
  "大佬观点": "Commentary",
  "现象/趋势": "Trends",
  "评测/基准": "Benchmarks",
  "作品/案例": "Work",
  "论文/研究": "Research",
  "其他": "Other",
  "视频生成": "Video generation",
  "图像生成": "Image generation",
  "AI配音/音频": "Voice & audio",
  "AI翻译出海": "Translation & overseas",
  "数字人/换脸": "Digital humans",
  "ComfyUI/工作流": "ComfyUI & workflows",
  "剧本/文本": "Scripts & text",
  "动画/3D": "Animation & 3D",
  "音乐/音效": "Music & sound",
  "虚拟拍摄": "Virtual production",
  "端侧/实时": "On-device & realtime",
  "出海/投放": "Overseas distribution",
  "腾讯": "Tencent",
  "阿里": "Alibaba",
  "快手": "Kuaishou",
  "字节跳动": "ByteDance",
  "模型发布/更新": "Model releases",
  "工具与工作流": "Tools & workflows",
  "平台与监管": "Platforms & regulation",
  "技巧与观点": "Tips & opinion",
};

export function categoryLabel(key: string, locale: Locale): string {
  if (locale === "en" && key in CATEGORY_EN) return CATEGORY_EN[key as CategoryKey];
  return (CATEGORY_LABELS as Record<string, string>)[key] ?? key;
}

export function channelLabel(key: string, locale: Locale): string {
  if (locale === "en" && key in CHANNEL_EN) return CHANNEL_EN[key as ChannelKey];
  return (CHANNEL_LABELS as Record<string, string>)[key] ?? key;
}

/** Display name of a tag or report-section title. Unknown tags stay as written. */
export function tagLabel(tag: string, locale: Locale): string {
  if (locale !== "en") return tag;
  return TAG_EN[tag] ?? tag;
}
