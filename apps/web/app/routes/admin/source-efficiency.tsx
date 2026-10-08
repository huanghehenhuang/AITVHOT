import { SITE } from "@aihot/industry/site";
import { Link } from "react-router";
import type { AdminSourceCost, AdminSourceEfficiency } from "@aihot/contracts/admin";
import type { Route } from "./+types/source-efficiency";
import { adminGet } from "../../lib/admin.server";
import { bj, num } from "../../features/admin/format";
import { KIND_LABEL, MODE_LABEL } from "../../features/admin/labels";
import { AdminPage, Badge, ButtonLink, Card, DataTable, Stat } from "../../features/admin/ui";

export async function loader({ request }: Route.LoaderArgs) {
  const days = new URL(request.url).searchParams.get("days") === "30" ? 30 : 7;
  return adminGet<AdminSourceEfficiency>(request, `/api/admin/sources/efficiency?days=${days}`);
}

export const meta: Route.MetaFunction = () => [{ title: `信源产出与成本 · ${SITE.name} 后台` }];

function amount(value: number, currency: string) {
  const prefix = currency === "USD" ? "$" : currency === "CNY" ? "¥" : `${currency} `;
  return prefix + value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function Costs({ costs, stage }: { costs: AdminSourceCost[]; stage: AdminSourceCost["stage"] }) {
  const rows = costs.filter((cost) => cost.stage === stage);
  const attempts = rows.reduce((n, row) => n + row.attempts, 0);
  const unpriced = rows.reduce((n, row) => n + row.unpriced, 0);
  if (!attempts) return <span className="text-ink-4">无付费回执</span>;
  return <div className="space-y-1 text-[12.5px]">
    {rows.filter((row) => row.currency !== null).map((row) => <div key={row.currency} className="num whitespace-nowrap">
      {row.actual > 0 && <span>{amount(row.actual, row.currency!)} 实际</span>}
      {row.actual > 0 && row.estimated > 0 && " + "}
      {row.estimated > 0 && <span>≈ {amount(row.estimated, row.currency!)} 估算</span>}
      {row.actual === 0 && row.estimated === 0 && <span>{amount(0, row.currency!)} 已记录</span>}
    </div>)}
    <div className="text-ink-4">{num(attempts)} 次请求{unpriced > 0 && <span className="text-hot"> · {num(unpriced)} 次金额缺失</span>}</div>
  </div>;
}

export default function SourceEfficiency({ loaderData: data }: Route.ComponentProps) {
  const { days, rows, totals, sharedCosts } = data;
  return <AdminPage
    title="信源产出与成本"
    subtitle={`${bj(data.from)} — ${bj(data.to)}（北京时间）。按贡献的精选事件数排序。`}
    actions={<><ButtonLink to="/admin/sources/efficiency?days=7" tone={days === 7 ? "primary" : "secondary"}>近 7 天</ButtonLink><ButtonLink to="/admin/sources/efficiency?days=30" tone={days === 30 ? "primary" : "secondary"}>近 30 天</ButtonLink><ButtonLink to="/admin/sources">信源管理</ButtonLink></>}
  >
    <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="新增条目" value={num(totals.items)} />
      <Stat label="精选文章" value={num(totals.selected)} />
      <Stat label="去重后的精选事件" value={num(totals.events)} />
      <Stat label="精选待归组" value={num(totals.ungrouped)} />
    </div>
    <div className="mb-5 grid gap-3 md:grid-cols-2">
      <Card title="全部采集费用"><Costs costs={totals.costs} stage="collection" /></Card>
      <Card title="全部模型费用"><Costs costs={totals.costs} stage="model" /></Card>
    </div>
    <Card pad={false}>
      <DataTable rows={rows} rowKey={(row) => row.id} empty="还没有信源" columns={[
        { key: "name", label: "信源", render: (row) => <div className="min-w-[200px]"><Link to={`/admin/sources/${encodeURIComponent(row.id)}`} className="font-medium text-ink hover:text-accent">{row.name}</Link><div className="mt-1 flex gap-1"><Badge>{KIND_LABEL[row.kind] ?? row.kind}</Badge><Badge>{MODE_LABEL[row.participation_mode] ?? row.participation_mode}</Badge>{!row.enabled && <Badge>已暂停</Badge>}</div></div> },
        { key: "items", label: "新增条目", align: "right", render: (row) => num(row.items) },
        { key: "selected", label: "精选文章", align: "right", render: (row) => num(row.selected) },
        { key: "events", label: "精选事件", align: "right", render: (row) => num(row.events) },
        { key: "ungrouped", label: "待归组", align: "right", render: (row) => num(row.ungrouped) },
        { key: "collection", label: "采集费", render: (row) => <Costs costs={row.costs} stage="collection" /> },
        { key: "model", label: "模型费", render: (row) => <Costs costs={row.costs} stage="model" /> },
      ]} />
    </Card>
    <div className="mt-5 grid gap-3 md:grid-cols-2">
      <Card title="共用及未归属的采集费"><Costs costs={sharedCosts} stage="collection" /></Card>
      <Card title="共用及未归属的模型费"><Costs costs={sharedCosts} stage="model" /></Card>
    </div>
    <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
      一个事件可由多个信源贡献，各行事件数不能相加；顶部事件数已跨信源去重。产出按条目首次发现时间统计，包含首次导入的历史条目。
      费用按本窗口实际发出的请求统计，重试也计入，只读取线上回执。共用的 X 搜索、事件综述、日报及无法归属的请求单列，已计入顶部总费用。
      金额缺失不代表免费；模型估算使用当前配置的单价与 token 用量，不同币种分别展示，最终以账单为准。
    </p>
  </AdminPage>;
}
