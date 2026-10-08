import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { execFileSync } from "node:child_process";
import { sql, closeDb } from "@aihot/backend/db";
import { createSource } from "@aihot/backend/admin/sources";
import { seedSources, type SeedSource } from "@aihot/backend/sources/seed";

const T = tag();
const source = (suffix: string, path = suffix): SeedSource => ({ id: `seed-${T}-${suffix}`, name: suffix, kind: "rss", config: { feedUrl: `https://example.org/${T}/${path}` } });
after(closeDb);

test("dry runs and paused imports preserve existing configuration and skip an administrator's alias", async () => {
  const old = source("custom", "feed");
  await sql`INSERT INTO sources (id, name, kind, config, enabled, interval_minutes, owner_entity_id)
            VALUES (${old.id}, 'Admin name', 'rss', ${sql.json(old.config as never)}, false, 777, 'custom-owner')`;
  const pack = [{ ...source("alias", "feed"), enabled: true }, { ...old, name: "Pack name", enabled: true, interval_minutes: 15 }, source("new")];
  const preview = await seedSources(pack, { dryRun: true });
  assert.deepEqual(preview.add.map((s) => s.id), [source("new").id]);
  assert.deepEqual(preview.existing, [old.id]);
  assert.equal(preview.duplicates[0]!.existingId, old.id);
  assert.equal((await sql`SELECT 1 FROM sources WHERE id = ${source("new").id}`).length, 0);
  const imported = await seedSources(pack, { disabled: true });
  assert.deepEqual(imported, preview);
  const [kept] = await sql`SELECT name, config, enabled, interval_minutes, owner_entity_id FROM sources WHERE id = ${old.id}`;
  assert.deepEqual(kept, { name: "Admin name", config: old.config, enabled: false, interval_minutes: 777, owner_entity_id: "custom-owner" });
  const [added] = await sql`SELECT enabled FROM sources WHERE id = ${source("new").id}`;
  assert.equal(added!.enabled, false);
  assert.equal((await seedSources(pack)).add.length, 0);
  assert.equal((await sql`SELECT enabled FROM sources WHERE id = ${source("new").id}`)[0]!.enabled, false);
});

test("an insert failure rolls back the whole source import", async () => {
  const good = source("atomic-good");
  const bad = { ...source("atomic-bad"), tier: "invalid-tier" };
  await assert.rejects(seedSources([good, bad]));
  assert.equal((await sql`SELECT 1 FROM sources WHERE id IN (${good.id}, ${bad.id})`).length, 0);
});

test("seed and administrator intake cannot concurrently create aliases of one feed", async () => {
  const first = source("race-seed", "race-feed");
  const second = source("race-admin", "race-feed");
  const blocker = await sql.reserve();
  await blocker`BEGIN`;
  await blocker`SELECT pg_advisory_xact_lock(hashtext('admin-source-identity'))`;
  const pending = Promise.all([seedSources([first]), createSource(second, "test-seed-race")]);
  try {
    for (let i = 0; ; i++) {
      const [waiting] = await sql`SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%admin-source-identity%'`;
      if (waiting!.n >= 2) break;
      assert.ok(i < 200, "both imports reached the identity lock");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } finally {
    await blocker`ROLLBACK`;
    blocker.release();
  }
  const [seed, admin] = await pending;
  assert.equal(seed.add.length + Number(admin.created), 1);
  assert.equal((await sql`SELECT 1 FROM sources WHERE id IN (${first.id}, ${second.id})`).length, 1);
});

test("the dry-run CLI does not seed topics, sources or the model directory", async () => {
  const before = await sql`SELECT (SELECT count(*) FROM sources) AS sources, (SELECT count(*) FROM topics) AS topics, (SELECT count(*) FROM lb_models) AS models,
                           (SELECT md5(string_agg(xmin::text || slug || name, ',' ORDER BY slug)) FROM topics) AS topic_state`;
  const output = execFileSync(process.execPath, ["scripts/seed.ts", "--dry-run"], { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  assert.ok(output.includes('"mode": "dry-run"'));
  assert.ok(!output.includes("topics:") && !output.includes("leaderboard directory:"));
  assert.deepEqual(await sql`SELECT (SELECT count(*) FROM sources) AS sources, (SELECT count(*) FROM topics) AS topics, (SELECT count(*) FROM lb_models) AS models,
                            (SELECT md5(string_agg(xmin::text || slug || name, ',' ORDER BY slug)) FROM topics) AS topic_state`, before);
});
