import { sql } from "../db.ts";
import { assertSupportedConfig } from "./config-keys.ts";
import { sourceIdentity } from "./identity.ts";
import type { SourceRow } from "./types.ts";

export interface SeedSource {
  id: string;
  name: string;
  kind: SourceRow["kind"];
  config: Record<string, unknown>;
  tier?: string;
  first_party?: boolean;
  owner_entity_id?: string | null;
  participation_mode?: string;
  interval_minutes?: number;
  tags?: string[];
  site_fulltext?: boolean;
  syndicate_fulltext?: boolean;
  enabled?: boolean;
}

interface ExistingSource {
  id: string;
  name: string;
  kind: SourceRow["kind"];
  config: Record<string, unknown>;
}

export interface SourceImportPlan {
  add: SeedSource[];
  existing: string[];
  duplicates: Array<{ id: string; existingId: string; existingName: string }>;
}

/** Validate all configs before writes; preserve existing IDs and skip address aliases. */
export function planSourceImport(sources: SeedSource[], existing: ExistingSource[]): SourceImportPlan {
  const packIds = new Set<string>();
  for (const s of sources) {
    assertSupportedConfig(s.kind, s.config);
    if (packIds.has(s.id)) throw new Error(`Duplicate source ID: ${s.id}`);
    packIds.add(s.id);
  }
  const ids = new Set(existing.map((s) => s.id));
  const identities = new Map<string, ExistingSource>();
  const key = (s: ExistingSource) => {
    const identity = sourceIdentity(s.kind, s.config);
    return identity ? `${s.kind}:${identity}` : null;
  };
  for (const s of existing) {
    const k = key(s);
    if (k && !identities.has(k)) identities.set(k, s);
  }
  const plan: SourceImportPlan = { add: [], existing: [], duplicates: [] };
  for (const s of sources) {
    if (ids.has(s.id)) {
      plan.existing.push(s.id);
      continue;
    }
    const k = key(s);
    const duplicate = k ? identities.get(k) : null;
    if (duplicate) {
      plan.duplicates.push({ id: s.id, existingId: duplicate.id, existingName: duplicate.name });
      continue;
    }
    plan.add.push(s);
    ids.add(s.id);
    if (k) identities.set(k, s);
  }
  return plan;
}

/** A dry run only reads sources. Actual imports share the administrator's identity lock. */
export async function seedSources(sources: SeedSource[], options: { dryRun?: boolean; disabled?: boolean } = {}): Promise<SourceImportPlan> {
  if (options.dryRun) {
    const rows = await sql<ExistingSource[]>`SELECT id, name, kind, config FROM sources ORDER BY id`;
    return planSourceImport(sources, rows);
  }
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtext('admin-source-identity'))`;
    const rows = await tx<ExistingSource[]>`SELECT id, name, kind, config FROM sources ORDER BY id`;
    const plan = planSourceImport(sources, rows);
    for (const s of plan.add) {
      await tx`
        INSERT INTO sources (id, name, kind, config, tier, first_party, owner_entity_id, participation_mode, interval_minutes, tags, site_fulltext, syndicate_fulltext, enabled, next_fetch_at)
        VALUES (${s.id}, ${s.name}, ${s.kind}, ${tx.json(s.config as never)}, ${s.tier ?? "T2"}, ${s.first_party ?? false}, ${s.owner_entity_id ?? null},
                ${s.participation_mode ?? "editorial"}, ${s.interval_minutes ?? 60}, ${s.tags ?? []}, ${s.site_fulltext ?? false}, ${s.syndicate_fulltext ?? false},
                ${options.disabled ? false : s.enabled ?? true}, now())`;
    }
    return plan;
  }) as Promise<SourceImportPlan>;
}
