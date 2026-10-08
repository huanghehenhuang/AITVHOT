// Source yield and paid attempts in the same rolling window. Shared work is kept separate instead
// of assigning an arbitrary share to each source; retries count, receipt reuse does not.
import type { AdminSourceCost, AdminSourceEfficiency, BeforeJson } from "@aihot/contracts/admin";
import { sql } from "../db.ts";
import { listedCondition, selectedCondition } from "../publication/scope.ts";

type Overview = BeforeJson<AdminSourceEfficiency>;
type CostRow = AdminSourceCost & { source_id: string | null };

function totalCosts(rows: AdminSourceCost[]): AdminSourceCost[] {
  const totals = new Map<string, AdminSourceCost>();
  for (const row of rows) {
    const key = `${row.stage}:${row.currency ?? ""}`;
    const total = totals.get(key) ?? { stage: row.stage, currency: row.currency, actual: 0, estimated: 0, attempts: 0, unpriced: 0 };
    total.actual += row.actual;
    total.estimated += row.estimated;
    total.attempts += row.attempts;
    total.unpriced += row.unpriced;
    totals.set(key, total);
  }
  return [...totals.values()];
}

export async function sourceEfficiency(days: 7 | 30 = 7, at = new Date()): Promise<Overview> {
  const from = new Date(at.getTime() - days * 86400_000);
  const selected = sql`${listedCondition(at)} AND ${selectedCondition(at)} AND s.participation_mode = 'editorial'`;
  const [rows, events, costs] = await Promise.all([
    sql<Omit<Overview["rows"][number], "costs">[]>`
      SELECT s.id, s.name, s.kind, s.enabled, s.participation_mode,
             count(a.id)::int AS items, count(*) FILTER (WHERE ${selected})::int AS selected,
             count(DISTINCT p.story_id) FILTER (WHERE ${selected})::int AS events,
             count(*) FILTER (WHERE ${selected} AND p.story_id IS NULL)::int AS ungrouped
      FROM sources s
      LEFT JOIN articles a ON a.source_id = s.id AND a.discovered_at >= ${from} AND a.discovered_at < ${at}
      LEFT JOIN publications p ON p.article_id = a.id
      GROUP BY s.id ORDER BY events DESC, selected DESC, s.name, s.id`,
    sql<{ n: number }[]>`
      SELECT count(DISTINCT p.story_id)::int AS n FROM publications p JOIN sources s ON s.id = p.source_id
      JOIN articles a ON a.id = p.article_id
      WHERE a.discovered_at >= ${from} AND a.discovered_at < ${at} AND ${selected}`,
    sql<CostRow[]>`
      WITH calls AS (
        SELECT a.*, r.purpose, coalesce(article.source_id, source.id) AS source_id,
               CASE WHEN a.service IN ('socialdata', 'dajiala', 'jina') THEN 'collection' ELSE 'model' END AS stage
        FROM receipt_attempts a JOIN receipts r ON r.id = a.receipt_id
        LEFT JOIN articles article ON article.id = substring(r.subject from '^article:([^@:#]+)')
        LEFT JOIN sources source ON source.id = CASE WHEN r.subject LIKE 'source:%' THEN substring(r.subject from 8) ELSE r.subject END
        WHERE a.origin = 'live' AND a.started_at >= ${from} AND a.started_at < ${at}
      ), usage AS (
        SELECT c.*, p.currency AS price_currency, p.input_per_mtok, p.cached_per_mtok, p.output_per_mtok,
               CASE WHEN jsonb_typeof(c.usage->'prompt_tokens') = 'number' THEN (c.usage->>'prompt_tokens')::numeric
                    WHEN c.purpose = 'embedding' AND jsonb_typeof(c.usage->'total_tokens') = 'number' THEN (c.usage->>'total_tokens')::numeric END AS tokens_in,
               CASE WHEN c.purpose = 'embedding' THEN 0
                    WHEN jsonb_typeof(c.usage->'completion_tokens') = 'number' THEN (c.usage->>'completion_tokens')::numeric END AS tokens_out,
               CASE WHEN jsonb_typeof(c.usage->'prompt_tokens_details'->'cached_tokens') = 'number' THEN (c.usage->'prompt_tokens_details'->>'cached_tokens')::numeric
                    WHEN jsonb_typeof(c.usage->'prompt_cache_hit_tokens') = 'number' THEN (c.usage->>'prompt_cache_hit_tokens')::numeric ELSE 0 END AS cached_tokens
        FROM calls c LEFT JOIN LATERAL (
          SELECT * FROM service_prices p WHERE p.service = c.service AND p.model IN (coalesce(c.model, ''), '')
          ORDER BY (p.model = coalesce(c.model, '')) DESC LIMIT 1
        ) p ON true
      ), estimates AS (
        SELECT u.*, CASE WHEN u.model IS NOT NULL AND u.status IN ('received', 'failed')
          AND tokens_in >= 0 AND tokens_out >= 0 AND cached_tokens BETWEEN 0 AND tokens_in
          AND (tokens_in = 0 OR input_per_mtok >= 0) AND (tokens_out = 0 OR output_per_mtok >= 0)
          AND (cached_per_mtok IS NULL OR cached_per_mtok >= 0)
          THEN ((tokens_in - cached_tokens) * coalesce(input_per_mtok, 0)
                + cached_tokens * coalesce(cached_per_mtok, input_per_mtok, 0)
                + tokens_out * coalesce(output_per_mtok, 0)) / 1000000 END AS token_cost
        FROM usage u
      ), valued AS (
        SELECT e.*, CASE WHEN cost IS NOT NULL AND currency IS NOT NULL AND cost_basis IS NOT NULL THEN cost
                        WHEN cost IS NULL AND price_currency IS NOT NULL THEN token_cost END AS amount,
               CASE WHEN cost IS NOT NULL AND currency IS NOT NULL AND cost_basis IS NOT NULL THEN currency
                    WHEN cost IS NULL AND token_cost IS NOT NULL THEN price_currency END AS amount_currency,
               CASE WHEN cost IS NOT NULL AND currency IS NOT NULL AND cost_basis IS NOT NULL THEN cost_basis ELSE 'estimated' END AS basis
        FROM estimates e
      )
      SELECT source_id, stage, amount_currency AS currency,
             coalesce(sum(amount) FILTER (WHERE basis = 'actual'), 0) AS actual,
             coalesce(sum(amount) FILTER (WHERE basis = 'estimated'), 0) AS estimated,
             count(*)::int AS attempts, count(*) FILTER (WHERE amount IS NULL)::int AS unpriced
      FROM valued GROUP BY source_id, stage, amount_currency ORDER BY source_id, stage, amount_currency`,
  ]);
  const perSource = new Map<string, AdminSourceCost[]>();
  for (const { source_id, ...cost } of costs) {
    if (source_id === null) continue;
    const sourceCosts = perSource.get(source_id) ?? [];
    sourceCosts.push(cost);
    perSource.set(source_id, sourceCosts);
  }
  return {
    days, from, to: at,
    rows: rows.map((row) => ({ ...row, costs: perSource.get(row.id) ?? [] })),
    totals: {
      items: rows.reduce((n, row) => n + row.items, 0),
      selected: rows.reduce((n, row) => n + row.selected, 0),
      events: events[0]!.n,
      ungrouped: rows.reduce((n, row) => n + row.ungrouped, 0),
      costs: totalCosts(costs),
    },
    sharedCosts: totalCosts(costs.filter((cost) => cost.source_id === null)),
  };
}
