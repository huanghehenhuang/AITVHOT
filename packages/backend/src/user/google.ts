// Google sign-in for readers. The code-for-token exchange and the userinfo call both go out through
// the egress route: accounts.google.com and googleapis.com are unreachable directly from the
// production host (measured 2026-10-25) but all answer through EGRESS_PROXY_URL. Google's email
// claim is required verified, so it may safely merge into a same-email account.
import { randomBytes } from "node:crypto";
import { config, credential } from "../config.ts";
import { sql } from "../db.ts";
import { guardedFetch } from "../lib/http-fetch.ts";
import { createSession, safeUserReturn, sign, unsign } from "./auth.ts";

export class GoogleRejected extends Error {
  readonly reason: "state" | "token" | "profile";
  constructor(reason: GoogleRejected["reason"]) {
    super(reason);
    this.reason = reason;
  }
}

export function googleOAuthConfigured(): boolean {
  return !!credential("integrations", "GOOGLE_OAUTH_CLIENT_ID") && !!credential("integrations", "GOOGLE_OAUTH_CLIENT_SECRET");
}

/** Computed per call, never at import time: the admin module's CALLBACK_URL constant freezes
 *  SITE_URL whenever the module is first imported. */
const callbackUrl = () => `${config.siteUrl}/api/auth/google/callback`;

export function googleRedirect(returnTo: string): { url: string; stateCookie: string } {
  const clientId = credential("integrations", "GOOGLE_OAUTH_CLIENT_ID");
  if (!clientId) throw new Error("GOOGLE_OAUTH_CLIENT_ID is not configured");
  const state = `${randomBytes(16).toString("base64url")}|${safeUserReturn(returnTo)}`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state: sign(state),
  })}`;
  return { url, stateCookie: sign(state) };
}

interface GoogleProfile {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
}

function json<T>(res: { status: number; text(): string }, step: string): T {
  try {
    return JSON.parse(res.text()) as T;
  } catch {
    throw new Error(`Google ${step} response is not valid JSON (HTTP ${res.status})`);
  }
}

export async function completeGoogleLogin(code: string, state: string, stateCookie: string | undefined, userAgent: string | undefined) {
  const expected = unsign(stateCookie);
  const given = unsign(state);
  if (!expected || !given || expected !== given) throw new GoogleRejected("state");
  const returnTo = given.split("|")[1] ?? "/";
  const clientId = credential("integrations", "GOOGLE_OAUTH_CLIENT_ID");
  const clientSecret = credential("integrations", "GOOGLE_OAUTH_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new GoogleRejected("token");
  const tokenRes = await guardedFetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret, redirect_uri: callbackUrl(), grant_type: "authorization_code",
    }).toString(),
    route: "egress",
    timeoutMs: 15_000,
    maxRedirects: 0,
  });
  const token = json<{ access_token?: string }>(tokenRes, "token");
  if (tokenRes.status !== 200 || !token.access_token) throw new GoogleRejected("token");
  const profileRes = await guardedFetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
    route: "egress",
    timeoutMs: 15_000,
    maxRedirects: 0,
  });
  if (profileRes.status !== 200) throw new GoogleRejected("token");
  const profile = json<GoogleProfile>(profileRes, "profile");
  const sub = typeof profile.sub === "string" && profile.sub ? profile.sub : null;
  const email = typeof profile.email === "string" && profile.email ? profile.email.toLowerCase() : null;
  // An unverified email claim must not merge into a same-email account.
  if (!sub || !email || profile.email_verified !== true) throw new GoogleRejected("profile");
  const name = typeof profile.name === "string" && profile.name ? profile.name.slice(0, 80) : null;
  const picture = typeof profile.picture === "string" && profile.picture ? profile.picture.slice(0, 500) : null;
  const sessionToken = await createSession((await upsertGoogleUser({ sub, email, name, picture })).id, userAgent, "google", sub);
  return { sessionToken, returnTo };
}

export interface GoogleUser {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
}

/** By Google subject, else by the (verified) email — the same-email magic-link account is the same
 *  person — else a new user. A race between the lookup and the insert falls to the route's handler. */
export async function upsertGoogleUser(profile: GoogleUser): Promise<{ id: number }> {
  const [existing] = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE google_sub = ${profile.sub} OR email = ${profile.email} LIMIT 1`;
  if (existing) {
    const [user] = await sql<{ id: number }[]>`
      UPDATE users SET google_sub = coalesce(google_sub, ${profile.sub}), email_verified = true, last_login_at = now(),
                       display_name = coalesce(display_name, ${profile.name}), avatar_url = coalesce(avatar_url, ${profile.picture})
      WHERE id = ${existing.id} RETURNING id`;
    return user!;
  }
  const [user] = await sql<{ id: number }[]>`
    INSERT INTO users (email, email_verified, display_name, avatar_url, google_sub, last_login_at)
    VALUES (${profile.email}, true, ${profile.name ?? profile.email.split("@")[0]!.slice(0, 80)}, ${profile.picture}, ${profile.sub}, now())
    RETURNING id`;
  return user!;
}
