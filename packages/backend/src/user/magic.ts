// Email magic links: a one-shot token (hashed at rest) is mailed to the address; consuming it
// proves mailbox ownership, creates the user (or reuses the same-email one) and starts a session.
// Rate limits count recent rows in login_tokens — database state, so a restart or a second process
// cannot reset them (the admin login's in-memory window has neither property).
import { randomBytes } from "node:crypto";
import { config } from "../config.ts";
import { sql } from "../db.ts";
import { sha256 } from "../lib/ids.ts";
import { mailConfigured, sendLoginMail } from "../notify/mail.ts";
import { createSession, safeUserReturn } from "./auth.ts";

export class MagicRejected extends Error {
  readonly reason: "bad_email" | "unset" | "rate_limited" | "expired" | "send_failed";
  constructor(reason: MagicRejected["reason"]) {
    super(reason);
    this.reason = reason;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_MINUTES = 10;
const LIMIT_MINUTES = 15;

/** Three per address, ten per sending address, a hundred in all per 15 minutes. The counts are
 *  read before the caller inserts, so a concurrent burst may overshoot each limit by the size of
 *  the burst; the numbers are an anti-abuse budget, not an accounting invariant. */
async function overLimit(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - LIMIT_MINUTES * 60_000);
  const [row] = await sql<{ per_email: number; per_ip: number; total: number }[]>`
    SELECT (SELECT count(*) FROM login_tokens WHERE email = ${email} AND created_at > ${since})::int AS per_email,
           (SELECT count(*) FROM login_tokens WHERE created_ip = ${ip} AND created_at > ${since})::int AS per_ip,
           (SELECT count(*) FROM login_tokens WHERE created_at > ${since})::int AS total`;
  return row!.per_email >= 3 || row!.per_ip >= 10 || row!.total >= 100;
}

export async function requestMagicLink(emailRaw: string, returnTo: string, ip: string, userAgent: string | undefined): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) throw new MagicRejected("bad_email");
  if (!mailConfigured()) throw new MagicRejected("unset");
  if (await overLimit(email, ip)) throw new MagicRejected("rate_limited");
  const token = randomBytes(32).toString("base64url");
  // The return is sanitized before it goes into a mailed link: the confirm endpoint re-checks it,
  // but the mail itself should not carry a foreign address.
  const url = `${config.siteUrl}/api/auth/magic/confirm?${new URLSearchParams({ token, return: safeUserReturn(returnTo) })}`;
  await sql`INSERT INTO login_tokens (id_hash, email, expires_at, created_ip, user_agent)
            VALUES (${sha256(token)}, ${email}, ${new Date(Date.now() + TOKEN_MINUTES * 60_000)}, ${ip}, ${userAgent?.slice(0, 300) ?? null})`;
  try {
    await sendLoginMail({ to: email, url });
  } catch {
    // The token row stays: it documents the attempt and keeps counting toward the rate limit.
    throw new MagicRejected("send_failed");
  }
}

/** The conditional UPDATE consumes the token atomically: a second use of the same link finds
 *  used_at already set and fails, however the two requests interleave. */
export async function consumeMagicLink(token: string, userAgent: string | undefined): Promise<{ sessionToken: string; email: string }> {
  const [used] = await sql<{ email: string }[]>`
    UPDATE login_tokens SET used_at = now()
    WHERE id_hash = ${sha256(token)} AND used_at IS NULL AND expires_at > now()
    RETURNING email`;
  if (!used) throw new MagicRejected("expired");
  const email = used.email;
  const [user] = await sql<{ id: number }[]>`
    INSERT INTO users (email, email_verified, display_name, last_login_at)
    VALUES (${email}, true, ${email.split("@")[0]!.slice(0, 80)}, now())
    ON CONFLICT (email) DO UPDATE SET email_verified = true, last_login_at = now()
    RETURNING id`;
  const sessionToken = await createSession(user!.id, userAgent, "magic", email);
  return { sessionToken, email };
}
