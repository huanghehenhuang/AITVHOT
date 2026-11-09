// Translation memory is a projection of current public answers, never an independent public archive.
// Exact source identities make a correction immediately stop using the old translation.
import { createHash } from "node:crypto";
import { sql } from "../db.ts";

const TEXT_FIELDS = new Set(["title", "summary", "reason", "digest", "overview", "leadParagraph", "label", "caption", "definition", "blurb", "groupName", "latest"]);
const ORIGINAL_FIELDS = new Set(["body", "outline", "x", "originalTitle", "modules"]);
export const translationHash = (text: string) => createHash("sha256").update(text).digest("hex");
export const needsEnglish = (text: string) => /\p{Script=Han}/u.test(text);

/** Only editorial prose. Identifiers, filters, source names, original works and URLs stay intact. */
export function mapPublicationText<T>(value: T, replace: (text: string) => string): T {
  function walk(node: unknown, parent = ""): unknown {
    if (Array.isArray(node)) return node.map((v) => walk(v, parent));
    if (!node || typeof node !== "object") return node;
    return Object.fromEntries(Object.entries(node).map(([key, v]) => {
      if (ORIGINAL_FIELDS.has(key)) return [key, v];
      const prose = TEXT_FIELDS.has(key) || (key === "text" && parent === "excerpt")
        || (key === "name" && ("slug" in node || parent === "groups"));
      return [key, typeof v === "string" && prose ? replace(v) : walk(v, key)];
    }));
  }
  return walk(value) as T;
}

export function publicationTexts(value: unknown): string[] {
  const texts = new Set<string>();
  mapPublicationText(value, (text) => { if (needsEnglish(text)) texts.add(text); return text; });
  return [...texts];
}

export async function missingEnglish(texts: string[]): Promise<string[]> {
  if (!texts.length) return [];
  const rows = await sql<{ source_hash: string }[]>`
    SELECT source_hash FROM publication_translations WHERE language = 'en'
      AND source_hash IN ${sql(texts.map(translationHash))}`;
  const present = new Set(rows.map((r) => r.source_hash));
  return texts.filter((t) => !present.has(translationHash(t)));
}

export async function localizePublication<T>(body: T): Promise<{ body: T; complete: boolean }> {
  const texts = publicationTexts(body);
  if (!texts.length) return { body, complete: true };
  const rows = await sql<{ source_text: string; translated_text: string }[]>`
    SELECT source_text, translated_text FROM publication_translations WHERE language = 'en'
      AND source_hash IN ${sql(texts.map(translationHash))}`;
  const memory = new Map(rows.map((r) => [r.source_text, r.translated_text]));
  return { body: mapPublicationText(body, (text) => memory.get(text) ?? text), complete: texts.every((t) => memory.has(t)) };
}
