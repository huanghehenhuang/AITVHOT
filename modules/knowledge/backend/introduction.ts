import type { KnowledgeEntry } from "../types.ts";

export function needsIntroduction(summary: string) {
  return !summary.trim() || /^[|>][+-]?$/.test(summary.trim()) || /^(?:可查看和下载的 ComfyUI 工作流文件|ComfyUI 工作流文件，|AIGC 创作(?:相关的 Agent Skill|项目，功能说明)|AIGC 提示词合集，|官方创作指南、模型实践|导演、分镜、角色或视听设计相关 Skill|将故事、剧本或素材整理为导演|图像生成提示词、示例与模板资源)/.test(summary);
}

export function plainText(value: unknown): string {
  if (value && typeof value === "object") {
    const node = value as Record<string, unknown>;
    return plainText(node["#text"] ?? node["#cdata"]);
  }
  if (typeof value !== "string") return "";
  return value.replace(/<!--[^]*?-->|<[^>]*>|!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/&(?:amp|quot|apos|nbsp|#39);/g, token => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&#39;": "'", "&nbsp;": " " })[token] ?? token)
    .replace(/\s+/g, " ").trim();
}

function excerpt(text: string) {
  const words = text.split(/\s+/);
  if (words.length > 24) return words.slice(0, 24).join(" ").replace(/[,;:]$/, "") + "…";
  return text.length > 180 ? text.slice(0, 179) + "…" : text;
}

export function sourceIntroduction(entry: KnowledgeEntry, body: string): string | undefined {
  if (entry.kind === "skill") {
    const front = /^---\r?\n([^]*?)\r?\n---(?:\r?\n|$)/.exec(body)?.[1];
    const description = front?.match(/^description:[ \t]*(.*)((?:\r?\n[ \t]+[^\r\n]*)*)/m);
    if (!description) return;
    const text = plainText(/^[|>][+-]?$/.test(description[1]!.trim()) ? description[2] : description[1] + description[2]).replace(/^["']|["']$/g, "");
    return needsIntroduction(text) ? undefined : excerpt(text);
  }
  if (entry.kind === "workflow") {
    try {
      const { nodes } = JSON.parse(body) as { nodes: Array<{ type: string; widgets_values?: unknown }> };
      const types = [...new Set(nodes.map(node => node.type))];
      const operations = [
        [/image.?to.?video|img2vid|start.*end.*frame/i, "参考图转视频"], [/text.?to.?video|txt2vid/i, "文字生成视频"],
        [/image.?to.?image|img2img/i, "参考图重绘"], [/text.?to.?image|txt2img/i, "文字生成图片"],
        [/upscal/i, "超分放大"], [/inpaint/i, "局部重绘"], [/controlnet/i, "ControlNet 条件控制"],
        [/mesh|hunyuan3d|trellis/i, "3D 资产生成或处理"], [/video.?combine|savevideo|createvideo/i, "视频输出"],
        [/saveaudio|tts|text.?to.?speech/i, "音频生成或导出"], [/saveimage/i, "图像输出"],
      ] as const;
      const name = entry.title.replace(/[_.-]/g, " ");
      const steps = operations.filter(([pattern]) => pattern.test(name) || types.some(type => pattern.test(type))).map(([, label]) => label);
      const models = [...new Set(nodes.flatMap(node => Array.isArray(node.widgets_values) ? node.widgets_values : []).filter((v): v is string => typeof v === "string" && /\.(?:safetensors|gguf|ckpt)$/i.test(v)))].slice(0, 2);
      const usefulNodes = types.filter(type => !/^(?:Note|MarkdownNote|Reroute)$/i.test(type)).slice(0, 4);
      if (!usefulNodes.length) return;
      return `${steps.length ? `用途：${steps.join("、")}。` : ""}${models.length ? `引用模型：${models.join("、")}。` : ""}关键节点：${usefulNodes.join("、")}。`;
    } catch { return; }
  }
  const html = /^\s*(?:<!doctype|<html)/i.test(body);
  const candidates = html ? [...body.matchAll(/<p(?:\s[^>]*)?>([^]*?)<\/p>/gi)].map(match => match[1]!) :
    body.replace(/```[^]*?```/g, "").split(/\r?\n\s*\r?\n/).filter(block => !/^\s*(?:#|[>|-]|\*\s|\d+\.|<table|<div)/.test(block));
  for (const candidate of candidates) {
    const text = plainText(candidate).replace(/\*\*|`/g, "");
    if (text.length < 55 || text === entry.title || /^(?:copyright|disclaimer|welcome to|subscribe|sign up|please note|if you|thanks to|this repository is a mirror)/i.test(text)) continue;
    if (!/[.!?。！？]|\b(?:for|with|provides|build|generate|using)\b/i.test(text)) continue;
    return excerpt(text);
  }
}
