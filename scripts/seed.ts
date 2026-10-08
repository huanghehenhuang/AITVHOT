// Seeds a fresh site from the industry pack: the topics (industry/topics.json, updated in place), the
// sources (industry/sources.json, preserving existing IDs and skipping address aliases) and,
// with the leaderboard on, its model directory (only models and names not there yet).
// Re-runnable: node --env-file=.env scripts/seed.ts; --dry-run only reads, --sources-only skips
// topics/model-directory writes, --disabled stages new sources without enabling collection.
import { readFileSync } from "node:fs";
import path from "node:path";
import { FEATURES } from "@aihot/industry/features";
import { REPO_ROOT } from "@aihot/backend/config";
import { closeDb } from "@aihot/backend/db";
import { importModelDirectory } from "@aihot/backend/leaderboard/directory";
import { seedTopics } from "@aihot/backend/publication/topics";
import { planSourceImport, seedSources, type SeedSource } from "@aihot/backend/sources/seed";

const args = new Set(process.argv.slice(2));
const flags = ["--topics-only", "--sources-only", "--dry-run", "--disabled"];
for (const arg of args) if (!flags.includes(arg)) throw new Error(`Unknown seed option: ${arg}`);
if (args.has("--topics-only") && args.has("--sources-only")) throw new Error("Choose --topics-only or --sources-only");
if (args.has("--topics-only") && (args.has("--dry-run") || args.has("--disabled"))) throw new Error("--dry-run and --disabled apply to source imports");

try {
  if (args.has("--topics-only")) {
    console.log(`topics: ${await seedTopics()}`);
  } else {
    const { sources } = JSON.parse(readFileSync(path.join(REPO_ROOT, "industry/sources.json"), "utf8")) as { sources: SeedSource[] };
    // Refuse unsupported configs and repeated IDs before changing topics or any other rows.
    planSourceImport(sources, []);
    const dryRun = args.has("--dry-run");
    if (!dryRun && !args.has("--sources-only")) console.log(`topics: ${await seedTopics()}`);
    const plan = await seedSources(sources, { dryRun, disabled: args.has("--disabled") });
    console.log(`sources: ${plan.add.length} ${dryRun ? "would be added" : "added"}, ${plan.existing.length} IDs preserved, ${plan.duplicates.length} address aliases skipped`);
    if (dryRun) console.log(JSON.stringify({ mode: "dry-run", newSourcesEnabled: !args.has("--disabled"), ...plan }, null, 2));
    else for (const d of plan.duplicates) console.log(`skip ${d.id}: ${d.existingName} (${d.existingId}) already collects this address`);
    if (!dryRun && !args.has("--sources-only") && FEATURES.leaderboard) {
      const { models, aliases } = await importModelDirectory();
      console.log(`leaderboard directory: ${models} models, ${aliases} names added`);
    }
  }
} finally {
  await closeDb();
}
