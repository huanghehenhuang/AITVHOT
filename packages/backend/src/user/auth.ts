// Visitor identity: email magic links and Google OAuth sign into one users table. Opaque sessions
// are stored hashed like the admin's (admin/auth.ts), but with their own table, cookie and route
// file — the admin contract is never public, and the two systems stay separable.
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { credential } from "../config.ts";
import { sql } from "../db.ts";
import { sha256 } from "../lib/ids.ts";
import { parseCookies } from "../admin/auth.ts";

export const USER_SESSION_COOKIE = "aihot_user";
export const USER_STATE_COOKIE = "aihot_user_state";
export const USER_SESSION_DAYS = 30;

export interface UserPrincipal {
  userId: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  csrf: string;
  method: "magic" | "google";
}

function secret(): string {
  const s = credential("auth", "SESSION_SECRET");
  if (!s) throw new Error("SESSION_SECRET is not configured");
  return s;
}

/** The admin binding mirrored for visitors: an HMAC over the method and a stable identity, so
 *  changing SESSION_SECRET — or unbinding the identity — permanently invalidates the session. */
function sessionBinding(method: "magic" | "google", identity: string): string {
  return createHmac("sha256", secret()).update(JSON.stringify(["user-session-v1", method, identity])).digest("hex");
}

/** Mirrored from admin/auth.ts (kept private there): value.hmac with SESSION_SECRET. */
export function sign(value: string): string {
  return `${value}.${createHmac("sha256", secret()).update(value).digest("base64url")}`;
}

export function unsign(signed: string | undefined): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i <= 0) return null;
  const value = signed.slice(0, i);
  const expected = Buffer.from(sign(value).slice(i + 1));
  const given = Buffer.from(signed.slice(i + 1));
  return expected.length === given.length && timingSafeEqual(expected, given) ? value : null;
}

/** Any same-site path; other hosts and protocol-relative URLs fall back to "/". Backslashes are
 *  folded first: a browser reads "Location: /\evil.com" as a protocol-relative redirect, and the
 *  doubled form "//" and the scheme forms are refused outright. */
export function safeUserReturn(target: string): string {
  let path = target.replace(/\\/g, "/");
  // A return carried through mail or OAuth may be a whole URL; keep only its path and query.
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      path = `${u.pathname}${u.search}`;
    } catch {
      return "/";
    }
  }
  return /^\/(?!\/)/.test(path) ? path.slice(0, 500) : "/";
}

export async function createSession(userId: number, userAgent: string | undefined, method: "magic" | "google", identity: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await sql`INSERT INTO user_sessions (id_hash, user_id, csrf_token, expires_at, user_agent, auth_method, auth_binding)
            VALUES (${sha256(token)}, ${userId}, ${randomBytes(18).toString("base64url")}, ${new Date(Date.now() + USER_SESSION_DAYS * 86400_000)},
                    ${userAgent?.slice(0, 300) ?? null}, ${method}, ${sessionBinding(method, identity)})`;
  return token;
}

/** The identity a session binds to is a stable column of the user row: the email for magic links,
 *  the Google subject for Google. Rebinding the row kills its sessions. */
export async function userPrincipal(cookieHeader: string | undefined): Promise<UserPrincipal | null> {
  const token = parseCookies(cookieHeader)[USER_SESSION_COOKIE];
  if (!token) return null;
  const hash = sha256(token);
  const [row] = await sql<{ user_id: number; csrf_token: string; auth_method: string; auth_binding: string; email: string; google_sub: string | null; display_name: string | null; avatar_url: string | null }[]>`
    SELECT s.user_id, s.csrf_token, s.auth_method, s.auth_binding, u.email, u.google_sub, u.display_name, u.avatar_url
    FROM user_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.id_hash = ${hash} AND s.expires_at > now()`;
  if (!row) return null;
  const method = row.auth_method === "magic" || row.auth_method === "google" ? row.auth_method : null;
  const identity = method === "google" ? row.google_sub : row.email;
  const ok = method && identity && /^[0-9a-f]{64}$/.test(row.auth_binding) &&
    timingSafeEqual(Buffer.from(sessionBinding(method, identity), "hex"), Buffer.from(row.auth_binding, "hex"));
  if (!ok) {
    // A session seen to be invalid is gone for good: restoring the old configuration does not revive it.
    await sql`DELETE FROM user_sessions WHERE id_hash = ${hash}`;
    return null;
  }
  return { userId: row.user_id, email: row.email, displayName: row.display_name ?? row.email, avatarUrl: row.avatar_url, csrf: row.csrf_token, method };
}

export async function endUserSession(cookieHeader: string | undefined): Promise<void> {
  const token = parseCookies(cookieHeader)[USER_SESSION_COOKIE];
  if (token) await sql`DELETE FROM user_sessions WHERE id_hash = ${sha256(token)}`;
}
