import type { KnowledgeEntry } from "./types.ts";

const topics: Array<[string, RegExp]> = [
  ["短剧制作", /短剧|漫剧|short[ -]?drama|microdrama/i],
  ["导演分镜", /导演|分镜|storyboard|cinematograph|shot[ -]?(?:list|design)|director/i],
  ["剧本创作", /剧本|编剧|screenplay|scriptwriting/i],
  ["图像生成", /图像生成|图片生成|文生图|图生图|text.to.image|image generation|diffusion|\bflux\b|seedream|midjourney/i],
  ["视频生成", /视频生成|图生视频|文生视频|短片生成|image.to.video|text.to.video|video generation|seedance|kling|\bwan\b|\bveo\b/i],
  ["剪辑后期", /剪辑|后期|合成|video editing|remotion|compositing|ffmpeg|upscal|超分/i],
  ["配音与语音", /配音|语音|字幕|speech|\btts\b|\basr\b|voice|dubbing|subtitle|transcrib/i],
  ["音乐与音效", /音乐|音效|music|sound effect|audio generation/i],
  ["3D 与空间", /3D|空间|gaussian splat|trellis|mesh/i],
  ["模型微调", /微调|fine.tun|\bpeft\b|\blora\b|模型训练/i],
  ["推理与部署", /推理|部署|inference|quantiz|量化|部署|serving/i],
  ["多模态", /多模态|multimodal|vision.language/i],
  ["内容安全", /内容安全|content safety|moderation|审核模型/i],
  ["ComfyUI", /comfyui|comfy-org|comfy-tv/i],
];

export function suggestedTags(entry: KnowledgeEntry) {
  const text = [entry.title, entry.summary, entry.stage, entry.repo].join(" ");
  const tags = topics.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
  if (entry.kind === "prompt") tags.unshift("图片提示词");
  if (entry.kind === "workflow" && !tags.includes("ComfyUI")) tags.push("ComfyUI");
  return tags.length ? tags : [entry.stage];
}
