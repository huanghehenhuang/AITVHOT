import fs from "fs";
import path from "path";

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === "admin") continue;
      walk(p, out);
    } else if (/\.(tsx|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk("apps/web/app").filter((f) => !f.includes(`${path.sep}admin`) && !f.includes("admin-login"));
const re = /(["'`])((?:\\.|(?!\1)[^\\])*[一-鿿](?:\\.|(?!\1)[^\\])*)\1/g;
const set = new Map();
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  for (const m of s.matchAll(re)) {
    const text = m[2].replace(/\\n/g, "\n").replace(/\\"/g, '"');
    if (!set.has(text)) set.set(text, f.split(path.sep).join("/"));
  }
}
const lines = [...set.entries()].sort((a, b) => a[0].localeCompare(b[0], "zh"));
console.log("unique", lines.length);
for (const [text, f] of lines) console.log("---\n" + JSON.stringify(text) + "\n  " + f);
