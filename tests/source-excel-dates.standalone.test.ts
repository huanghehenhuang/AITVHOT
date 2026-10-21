import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { fetchJsonList } from "@aihot/backend/sources/json-list";

const rows = [
  { id: "illustrator", date: 45828 },
  { id: "topaz", date: "46288" },
  { id: "imageworks", date: 46297 },
  { id: "leap-boundary", date: 61 },
  ...[60, 0, -1, 61.5, "not a date", null, {}, Number.MAX_SAFE_INTEGER].map((date, i) => ({ id: `invalid-${i}`, date })),
];
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ data: rows }));
});
await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
const previousPrivateFetch = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
after(async () => {
  config.allowPrivateNetworkFetch = previousPrivateFetch;
  await new Promise<void>(resolve => server.close(() => resolve()));
});

test("spreadsheet publication days retain the publisher's calendar date and reject malformed or fictitious days", async () => {
  const address = server.address() as { port: number };
  for (const offset of ["+08:00", "-07:00"]) {
    const candidates = await fetchJsonList({ id: "excel-date-test", config: {
      url: `http://127.0.0.1:${address.port}/index`, mode: "json_api", itemsPath: "data",
      titlePaths: ["id"], urlTemplate: "https://example.org/{id}", publishedAtPath: "date",
      publishedAtUnit: "excel_days", publishedAtUtcOffset: offset,
    } } as never);
    assert.deepEqual(candidates.map(c => c.publishedAt?.toISOString() ?? null), [
      "2025-06-20T00:00:00.000Z", "2026-09-23T00:00:00.000Z", "2026-10-02T00:00:00.000Z",
      "1900-03-01T00:00:00.000Z", ...Array(8).fill(null),
    ]);
  }
});
