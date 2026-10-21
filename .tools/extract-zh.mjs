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

const files = walk("apps/web/app").filter(
  (f) => !f.includes(`${path.sep}admin`) && !f.includes("admin-login"),
);
const re = /(["'`])(?:\\.|(?!\1)[^\\])*[一-鿿](?:\\.|(?!\1)[^\\])*\1/g;
let n = 0;
const byFile = [];
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const ms = s.match(re) || [];
  if (ms.length) {
    n += ms.length;
    byFile.push([ms.length, f.split(path.sep).join("/")]);
  }
}
byFile.sort((a, b) => b[0] - a[0]);
console.log("files", byFile.length, "strings", n);
for (const [c, f] of byFile) console.log(String(c).padStart(4), f);
