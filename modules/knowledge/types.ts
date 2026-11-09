export interface KnowledgeEntry {
  id: string;
  kind: "tutorial" | "skill" | "project" | "prompt" | "workflow";
  title: string;
  summary: string;
  stage: string;
  prerequisites: string;
  url: string;
  checkUrl: string;
  repo?: string;
  license?: string;
  stars?: number;
  updatedAt?: string;
  addedAt?: string;
  checkedAt: string;
  status: "ok" | "unavailable";
}
export interface KnowledgeCatalog {
  checkedAt: string;
  entries: KnowledgeEntry[];
  runs?: KnowledgeRun[];
}
export interface KnowledgeEdit {
  revision: string;
  summary?: string;
  tags?: string[];
}
export interface KnowledgeRun {
  at: string;
  added: number;
  total: number;
  available: number;
  sources: number;
  failedSources: number;
}
