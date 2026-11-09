import type { ServerModule } from "@aihot/backend/modules";
import type { FastifyInstance } from "fastify";
import { actorOf } from "@aihot/backend/admin/auth";
import { adminHandler } from "../../apps/api/src/routes/admin-auth.ts";
import { loadKnowledge, readCatalog } from "./backend/publication.ts";
import { readKnowledgeEdits, saveKnowledgeEdit } from "./backend/edits.ts";
import { refreshKnowledge } from "./backend/refresh.ts";

export function registerKnowledge(app: FastifyInstance, readEdits = readKnowledgeEdits) {
  app.get("/api/knowledge", async (request, reply) => {
    reply.header("Cache-Control", "public, max-age=300");
    return loadKnowledge(new URL(request.url, "http://localhost").searchParams, await readEdits());
  });
  app.get("/api/admin/knowledge", adminHandler(async request => {
    const edits = await readEdits();
    const data = await loadKnowledge(new URL(request.url, "http://localhost").searchParams, edits);
    return { ...data, entries: data.entries.map(entry => ({ ...entry, revision: edits.get(entry.id)?.revision ?? "" })) };
  }));
  app.put("/api/admin/knowledge", adminHandler(async (request, reply, admin) => {
    const { id, summary, tags, revision } = (request.body ?? {}) as Record<string, unknown>;
    if (typeof id !== "string" || typeof revision !== "string" || typeof summary !== "string" || summary.length > 800 ||
      !Array.isArray(tags) || tags.length > 12 || tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.trim().length > 30)) {
      throw Object.assign(new Error("介绍最多 800 字，每条资源最多 12 个标签，每个标签最多 30 字。"), { statusCode: 400 });
    }
    if (!(await readCatalog()).entries.some(entry => entry.id === id)) return reply.code(404).send({ detail: "资源不存在" });
    return saveKnowledgeEdit(id, { summary: summary.trim() || undefined, tags: [...new Set(tags.map(tag => (tag as string).trim()))] }, revision, actorOf(admin));
  }));
}
export default {
  name: "knowledge",
  http: registerKnowledge,
  schedules: [{ name: "knowledge-link-check", cron: "20 5 * * *", missed: "once", run: refreshKnowledge, when: () => process.env.COLLECT_ENABLED === "true" }],
  sitemap: { pages: [{ loc: "/knowledge" }] },
} satisfies ServerModule;
