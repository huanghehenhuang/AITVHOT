import { useState } from "react";
import { Form, Link, useLoaderData } from "react-router";
import { adminGet } from "@aihot/web/lib/admin.server";
import { useAdminAction } from "@aihot/web/features/admin/action";
import { AdminPage, Button, Card, Input } from "@aihot/web/features/admin/ui";
import type { loadKnowledge } from "../backend/publication.ts";

type Catalog = Awaited<ReturnType<typeof loadKnowledge>>;
type Row = Catalog["entries"][number] & { revision: string };

export async function loader({ request }: { request: Request }) {
  return adminGet<Omit<Catalog, "entries"> & { entries: Row[] }>(request, `/api/admin/knowledge${new URL(request.url).search}`);
}

export function meta() { return [{ title: "知识库管理" }]; }

function ResourceEditor({ entry }: { entry: Row }) {
  const [summary, setSummary] = useState(entry.summary);
  const [tags, setTags] = useState(entry.tags.join("，"));
  const { run, busy } = useAdminAction();
  return <Card>
    <form className="space-y-3" onSubmit={event => {
      event.preventDefault();
      void run("PUT", "/api/admin/knowledge", {
        id: entry.id, revision: entry.revision, summary,
        tags: tags.split(/[,，、]/).map(tag => tag.trim()).filter(Boolean),
      }, { success: "条目已保存" });
    }}>
      <h2 className="font-semibold break-words"><a href={entry.url} target="_blank" rel="noreferrer">{entry.title} ↗</a></h2>
      <label className="block">用途介绍
        <textarea className="block w-full rounded-control border border-line bg-surface px-3 py-2" rows={3} maxLength={800} value={summary} onChange={event => setSummary(event.target.value)} />
      </label>
      <label className="block">标签（用逗号分隔，可输入新标签）
        <Input value={tags} onChange={event => setTags(event.target.value)} />
      </label>
      <Button type="submit" tone="primary" disabled={busy || (summary === entry.summary && tags === entry.tags.join("，"))}>保存</Button>
    </form>
  </Card>;
}

export default function KnowledgeAdmin() {
  const catalog = useLoaderData<typeof loader>();
  const pageUrl = (page: number) => `?${new URLSearchParams({ q: catalog.filters.q, tag: catalog.filters.tag, page: String(page) })}`;
  return <AdminPage title="知识库管理">
    <Form method="get" className="flex flex-wrap items-center gap-3">
      <Input type="search" name="q" aria-label="搜索知识库条目" placeholder="搜索标题、介绍或标签" defaultValue={catalog.filters.q} key={`q:${catalog.filters.q}`} />
      <select name="tag" aria-label="筛选标签" className="rounded-control border border-line bg-surface p-2" defaultValue={catalog.filters.tag} key={`tag:${catalog.filters.tag}`}>
        <option value="">全部标签</option>{catalog.tags.map(tag => <option key={tag}>{tag}</option>)}
      </select>
      <Button type="submit">查找</Button>
    </Form>
    <p className="py-3 text-sm text-ink-3">匹配 {catalog.matchedTotal} 项。手动保存的标签和介绍会在每日搜集后保留。</p>
    <div className="space-y-3">{catalog.entries.map(entry => <ResourceEditor key={`${entry.id}:${entry.revision}`} entry={entry} />)}</div>
    <nav className="flex gap-4 py-4" aria-label="知识库管理分页">
      {catalog.page > 1 && <Link to={pageUrl(catalog.page - 1)}>上一页</Link>}
      <span>第 {catalog.page} / {catalog.pages} 页</span>
      {catalog.page < catalog.pages && <Link to={pageUrl(catalog.page + 1)}>下一页</Link>}
    </nav>
  </AdminPage>;
}
