import fs from "fs";
import path from "path";

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "admin" || e.name === "i18n") continue;
      walk(p, out);
    } else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

const dict = ["apps/web/app/i18n/en.ts", ...fs.readdirSync("apps/web/app/i18n/extra").map((f) => `apps/web/app/i18n/extra/${f}`)]
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");

const re = /(?:\bt|translate)\(\s*(?:locale\s*,\s*)?(["'`])([^"'`]*[一-鿿][^"'`]*)\1/g;
const missing = new Map();
for (const f of walk("apps/web/app")) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(re)) {
    const key = m[2];
    if (!dict.includes(JSON.stringify(key))) {
      if (!missing.has(key)) missing.set(key, f.split(path.sep).join("/"));
    }
  }
}
console.log("missing", missing.size);
for (const [k, f] of missing) console.log(JSON.stringify(k), "<-", f);
