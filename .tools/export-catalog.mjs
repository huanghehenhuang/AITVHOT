import fs from "fs";

function pairs(file) {
  const s = fs.readFileSync(file, "utf8");
  const out = [];
  const re = /"((?:\\.|[^"\\])*)"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  for (const m of s.matchAll(re)) {
    out.push([JSON.parse(`"${m[1]}"`), JSON.parse(`"${m[2]}"`)]);
  }
  return out;
}

const files = ["apps/web/app/i18n/en.ts", ...fs.readdirSync("apps/web/app/i18n/extra").map((f) => `apps/web/app/i18n/extra/${f}`)];
const map = new Map();
for (const f of files) for (const [k, v] of pairs(f)) map.set(k, v);
const obj = Object.fromEntries(map);
fs.writeFileSync(".tools/en-catalog.json", JSON.stringify(obj));
console.log("keys", map.size, "bytes", Buffer.byteLength(JSON.stringify(obj)));
