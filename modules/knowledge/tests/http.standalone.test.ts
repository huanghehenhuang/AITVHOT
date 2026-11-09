import assert from "node:assert/strict";
import { test } from "node:test";
import Fastify from "fastify";
import { registerKnowledge } from "../server.ts";

test("knowledge API exposes the catalog and searchable typed resources with public caching", async () => {
  const app = Fastify();
  registerKnowledge(app, async () => new Map());
  try {
    const response = await app.inject("/api/knowledge?kind=skill&q=分镜");
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "public, max-age=300");
    const data = response.json();
    assert.ok(data.entries.length > 0);
    assert.ok(data.entries.every((entry: { kind: string }) => entry.kind === "skill"));
    assert.ok(data.total > data.entries.length);
    const empty = await app.inject("/api/knowledge?kind=not-a-resource-type");
    assert.equal(empty.statusCode, 200);
    assert.deepEqual(empty.json().entries, []);
    const tags = await app.inject("/api/knowledge?tag=ComfyUI&kind=workflow");
    assert.ok(tags.json().matchedTotal > 0);
    assert.ok(tags.json().entries.every((entry: { tags: string[] }) => entry.tags.includes("ComfyUI")));
    const denied = await app.inject({ method: "PUT", url: "/api/admin/knowledge", payload: {} });
    assert.equal(denied.statusCode, 401);
  } finally { await app.close(); }
});
