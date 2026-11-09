import { Form, Link, useLoaderData } from "react-router";
import { apiGet, cachedPage } from "@aihot/web/lib/api.server";
import { pageMeta } from "@aihot/web/lib/seo";
import type { loadKnowledge } from "../backend/publication.ts";
import { knowledgeTopics } from "../topic-links";
import "./style.css";

type CatalogResponse = Awaited<ReturnType<typeof loadKnowledge>>;
const kinds: Record<string, string> = { tutorial: "技术教程", skill: "Skill", project: "开源项目", prompt: "图片提示词集", workflow: "工作流" };
export const handle = { tab: "knowledge", name: "AIGC知识库" };
export { pageHeaders as headers } from "@aihot/web/lib/api.server";
export async function loader({ request }: { request: Request }) {
  const query = new URL(request.url).searchParams;
  return cachedPage(300, await apiGet<CatalogResponse>(`/api/knowledge?${query}`, { signal: request.signal }));
}
export function meta() {
  return pageMeta({ title: "AIGC知识库", description: "收集 AIGC 技术教程、Agent Skill 与开源项目，覆盖图像、视频、音频、3D、工作流与模型部署。", path: "/knowledge" });
}
export default function Knowledge() {
  const data = useLoaderData<typeof loader>();
  function pageLink(page: number) {
    const query = new URLSearchParams({ ...data.filters, page: String(page) });
    return `/knowledge?${query}`;
  }
  return <div className="knowledge-page">
    <header><h1>AIGC知识库</h1><p>收集图片提示词、导演 Skill、工作流、技术教程与开源项目，串联创意与内容制作。</p>
      <p>{data.total} 项资源 · 提示词集 {data.counts.prompt} · 工作流 {data.counts.workflow} · Skill {data.counts.skill} · 教程 {data.counts.tutorial} · 项目 {data.counts.project}</p>
    </header>
    <nav className="knowledge-shortcuts" aria-label="知识库快捷入口">
      <Link to="/knowledge?recent=7&sort=added">最近 7 天新增</Link>
      <Link to="/knowledge?kind=prompt">图片提示词集</Link>
      <Link to="/knowledge?kind=skill&stage=导演与分镜">导演 Skill</Link>
      <Link to="/knowledge?kind=workflow">图像与短剧工作流</Link>
      <Link to="/knowledge?kind=project">开源项目</Link>
      <Link to="/knowledge?kind=tutorial">技术教程</Link>
    </nav>
    <Form method="get" className="knowledge-search">
      <input type="search" name="q" aria-label="搜索AIGC知识库" placeholder="搜索分镜、配音、字幕、项目名称…" defaultValue={data.filters.q} key={`q:${data.filters.q}`} />
      <select name="kind" aria-label="资源类型" defaultValue={data.filters.kind} key={`kind:${data.filters.kind}`}><option value="">全部类型</option>{Object.entries(kinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select name="stage" aria-label="领域环节" defaultValue={data.filters.stage} key={`stage:${data.filters.stage}`}><option value="">全部领域环节</option>{data.stages.map(stage => <option key={stage}>{stage}</option>)}</select>
      <select name="tag" aria-label="资源标签" defaultValue={data.filters.tag} key={`tag:${data.filters.tag}`}><option value="">全部标签</option>{data.tags.map(tag => <option key={tag}>{tag}</option>)}</select>
      <select name="source" aria-label="资源来源" defaultValue={data.filters.source} key={`source:${data.filters.source}`}><option value="">全部资源来源</option>{data.sources.map(source => <option key={source}>{source}</option>)}</select>
      <select name="license" aria-label="许可证" defaultValue={data.filters.license} key={`license:${data.filters.license}`}><option value="">全部许可证</option>{data.licenses.map(license => <option key={license} value={license}>{license === "unknown" ? "许可待核对" : license}</option>)}</select>
      <select name="status" aria-label="访问状态" defaultValue={data.filters.status} key={`status:${data.filters.status}`}><option value="">全部访问状态</option><option value="ok">链接可访问</option><option value="unavailable">访问待复核</option></select>
      <select name="recent" aria-label="收录时间" defaultValue={data.filters.recent} key={`recent:${data.filters.recent}`}><option value="">全部收录时间</option><option value="1">最近 24 小时新增</option><option value="7">最近 7 天新增</option><option value="30">最近 30 天新增</option></select>
      <select name="sort" aria-label="排序方式" defaultValue={data.filters.sort} key={`sort:${data.filters.sort}`}><option value="added">最近收录</option><option value="catalog">原始收录顺序</option><option value="title">名称排序</option><option value="updated">最近仓库更新</option><option value="stars">GitHub Stars</option></select>
      <button type="submit">筛选</button><Link to="/knowledge">重置</Link>
    </Form>
    <p className="knowledge-note">链接核验记录用于确认资源可访问。安装运行与商用授权请以项目文档、代码和模型许可证为准。</p>
    <p className="knowledge-note">匹配 {data.matchedTotal} 项 · 第 {data.page} / {data.pages} 页</p>
    <div className="knowledge-grid">{data.entries.map(entry => <article key={entry.id}>
      <div className="knowledge-labels"><span>{kinds[entry.kind]}</span><span>{entry.stage}</span><span>{entry.status === "ok" ? "链接可访问" : "访问待复核"}</span></div>
      <h2><a href={entry.url} target="_blank" rel="noreferrer">{entry.title} ↗</a></h2>
      <p className="knowledge-intro"><strong>用途介绍</strong> {entry.summary || "待补充，可查看原始资料。"}</p>
      {entry.tags.length > 0 && <div className="knowledge-tags" aria-label="条目标签">{entry.tags.map(tag => <Link key={tag} to={`/knowledge?${new URLSearchParams({ ...data.filters, tag })}`}>{tag}</Link>)}</div>}
      {knowledgeTopics.some(topic => entry.tags.includes(topic.tag)) && (
        <div className="knowledge-tags" aria-label="相关主题动态">
          {knowledgeTopics.filter(topic => entry.tags.includes(topic.tag)).map(topic => (
            <Link key={topic.slug} to={`/topics/${topic.slug}`}>{topic.tag}动态 →</Link>
          ))}
        </div>
      )}
      <p className="knowledge-note">前置条件 · {entry.prerequisites}</p>
      {entry.repo && <p className="knowledge-note">{entry.repo}</p>}
      {entry.stars !== undefined && <p className="knowledge-note">GitHub ★ {entry.stars}{entry.updatedAt ? ` · 仓库更新 ${entry.updatedAt.slice(0, 10)}` : ""}</p>}
      <p className="knowledge-note">许可 · {entry.license ?? "查阅原站许可"} · 核验 {entry.checkedAt.slice(0, 10)}</p>
      {entry.addedAt && <p className="knowledge-note">收录 {new Date(entry.addedAt).toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" })}</p>}
      <a href={entry.url} target="_blank" rel="noreferrer">查看原始资源 →</a>
      {entry.kind === "workflow" && <p><a href={entry.checkUrl} target="_blank" rel="noreferrer">打开原始工作流文件 →</a></p>}
    </article>)}</div>
    {data.entries.length === 0 && <p role="status">没有匹配的资源，请调整关键词或筛选条件。</p>}
    {data.pages > 1 && <nav className="knowledge-pagination" aria-label="知识库分页">
      {data.page > 1 && <Link to={pageLink(data.page - 1)}>← 上一页</Link>}
      <span>第 {data.page} / {data.pages} 页</span>
      {data.page < data.pages && <Link to={pageLink(data.page + 1)}>下一页 →</Link>}
    </nav>}
    <section className="knowledge-updates"><h2>持续收集的技术动态</h2><p>浏览网站正在采集的教程、工具与项目发布，按需补充到制作流程。</p><Link to="/all?category=tip">教程实践 →</Link> <Link to="/all?category=tool">创作工具 →</Link></section>
  </div>;
}
