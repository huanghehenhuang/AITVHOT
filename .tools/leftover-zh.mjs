import fs from "fs";

const files = process.argv.slice(2);
const re = /(["'`])((?:\\.|(?!\1)[^\\])*[一-鿿](?:\\.|(?!\1)[^\\])*)\1/g;
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  const lines = s.split(/\n/);
  lines.forEach((line, i) => {
    if (!/[一-鿿]/.test(line)) return;
    if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) return;
    if (/\bt\(/.test(line) || /translate\(/.test(line) || /tagLabel\(/.test(line) || /categoryLabel\(/.test(line) || /channelLabel\(/.test(line) || /countLabel\(/.test(line)) return;
    // skip type-only and imports
    if (/from ["']/.test(line) && !/[一-鿿]/.test(line.split("from")[0] ?? "")) return;
    console.log(`${f}:${i + 1}: ${line.trim().slice(0, 180)}`);
  });
}
