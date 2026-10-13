// A pull request cannot change deployed history or hide an unsafe migration by naming it as history.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { checkMigrations } from "../scripts/check-migrations.ts";

const root = mkdtempSync(path.join(tmpdir(), "migration-git-"));
const ROOT = path.resolve(root);
after(() => rmSync(root, { recursive: true, force: true }));
const write = (file: string, text: string) => {
  const target = path.resolve(ROOT, file);
  if (!target.startsWith(ROOT + path.sep)) throw new Error(`outside the temp root: ${file}`);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
};
const GIT_OPTS = { cwd: root, encoding: "utf8" } as const;
execFileSync("git", ["init", "-q"], GIT_OPTS);
execFileSync("git", ["config", "user.email", "test@example.invalid"], GIT_OPTS);
execFileSync("git", ["config", "user.name", "Test"], GIT_OPTS);
write("database/migrations/0001_history.sql", "UPDATE old_table SET done = true;");
execFileSync("git", ["add", "."], GIT_OPTS);
execFileSync("git", ["commit", "-qm", "history"], GIT_OPTS);

test("unchanged history is accepted, but edits and deletions fail", () => {
  assert.deepEqual(checkMigrations(root, "HEAD"), []);
  write("database/migrations/0001_history.sql", "SELECT 1;");
  assert.match(checkMigrations(root, "HEAD").join("\n"), /immutable/);
  rmSync(path.join(root, "database/migrations/0001_history.sql"));
  assert.match(checkMigrations(root, "HEAD").join("\n"), /immutable/);
  execFileSync("git", ["restore", "."], GIT_OPTS);
});

test("new module migrations are checked even when untracked or named below the cutoff", () => {
  const file = "modules/example/migrations/0002_hidden.sql";
  write(file, "CREATE TABLE example (id int);");
  assert.match(checkMigrations(root, "HEAD").join("\n"), /0055/);
  rmSync(path.join(root, file));
  write("modules/example/migrations/0055_unsafe.sql", "UPDATE old_table SET done = false;");
  assert.match(checkMigrations(root, "HEAD").join("\n"), /0055_unsafe/);
  rmSync(path.join(root, "modules/example/migrations/0055_unsafe.sql"));
  write("modules/example/migrations/0055_safe.sql", "CREATE INDEX CONCURRENTLY IF NOT EXISTS example_idx ON example (id);");
  assert.deepEqual(checkMigrations(root, "HEAD"), []);
});
