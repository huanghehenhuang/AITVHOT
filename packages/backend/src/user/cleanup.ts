// Daily cleanup of the visitor-auth rows: spent magic-link tokens (they double as the rate-limit
// ledger, so they stay a week) and expired sessions. Runs from the worker's schedules.
import { sql } from "../db.ts";

export async function cleanupExpiredAuthRows(): Promise<{ tokens: number; sessions: number }> {
  const [tokens] = await sql<{ count: number }[]>`WITH gone AS (DELETE FROM login_tokens WHERE created_at < now() - interval '7 days' RETURNING 1) SELECT count(*) FROM gone`;
  const [sessions] = await sql<{ count: number }[]>`WITH gone AS (DELETE FROM user_sessions WHERE expires_at < now() RETURNING 1) SELECT count(*) FROM gone`;
  return { tokens: Number(tokens!.count), sessions: Number(sessions!.count) };
}
