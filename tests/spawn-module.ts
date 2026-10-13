// Child processes under test run a source string as a module. Writing it to a per-call file under the
// repo's node_modules/.cache keeps interpreter arguments literal (no "-e" script payloads) while bare
// specifiers in the source still resolve against the repo's dependencies; each process removes its
// directory on exit.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = path.join(process.cwd(), "node_modules", ".cache", "aihot-test-modules");
const dirs: string[] = [];
let cleanupInstalled = false;

export function spawnModuleFile(source: string): string {
  mkdirSync(base, { recursive: true });
  const dir = mkdtempSync(path.join(base, "run-"));
  dirs.push(dir);
  if (!cleanupInstalled) {
    cleanupInstalled = true;
    process.on("exit", () => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });
  }
  const file = path.join(dir, "module.mjs");
  writeFileSync(file, source);
  return file;
}
