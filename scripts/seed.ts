// Seeds a fresh site's sources from the industry pack (industry/sources.json, preserving existing IDs
// and skipping address aliases). Topics come from industry/topics.json at startup, so nothing seeds them.
// Re-runnable: node --env-file=.env scripts/seed.ts; --dry-run only reads, --disabled stages new sources
// without enabling collection.
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "@aihot/backend/config";
import { closeDb } from "@aihot/backend/db";
import { planSourceImport, seedSources, type SeedSource } from "@aihot/backend/sources/seed";

const args = new Set(process.argv.slice(2));
const flags = ["--dry-run", "--disabled"];
for (const arg of args) if (!flags.includes(arg)) throw new Error(`Unknown seed option: ${arg}`);

try {
  {
    const { sources } = JSON.parse(readFileSync(path.join(REPO_ROOT, "industry/sources.json"), "utf8")) as { sources: SeedSource[] };
    // Refuse unsupported configs and repeated IDs before changing any rows.
    planSourceImport(sources, []);
    const dryRun = args.has("--dry-run");
    const plan = await seedSources(sources, { dryRun, disabled: args.has("--disabled") });
    console.log(`sources: ${plan.add.length} ${dryRun ? "would be added" : "added"}, ${plan.existing.length} IDs preserved, ${plan.duplicates.length} address aliases skipped`);
    if (dryRun) console.log(JSON.stringify({ mode: "dry-run", newSourcesEnabled: !args.has("--disabled"), ...plan }, null, 2));
    else for (const d of plan.duplicates) console.log(`skip ${d.id}: ${d.existingName} (${d.existingId}) already collects this address`);
  }
} finally {
  await closeDb();
}
