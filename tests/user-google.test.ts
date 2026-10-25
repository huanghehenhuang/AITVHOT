// Google sign-in: the offline parts of the OAuth flow — state validation, the authorize URL, the
// route's unconfigured behavior — and the account merge rules the verified-email claim allows.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { completeGoogleLogin, googleOAuthConfigured, googleRedirect, upsertGoogleUser } from "@aihot/backend/user/google";
import { safeUserReturn, unsign } from "@aihot/backend/user/auth";
import { buildApp } from "../apps/api/src/app.ts";

process.env.GOOGLE_OAUTH_CLIENT_ID ??= "test-client-id.apps.googleusercontent.com";
process.env.GOOGLE_OAUTH_CLIENT_SECRET ??= "test-client-secret";

const app = await buildApp();
after(async () => {
  await app.close();
  await closeDb();
});

test("the state check runs before anything touches the network", async () => {
  await assert.rejects(completeGoogleLogin("code", "forged", "different", undefined), /state/);
  await assert.rejects(completeGoogleLogin("code", "forged", undefined, undefined), /state/);
});

test("the authorize URL carries the callback this deployment registers, and the signed state", () => {
  assert.ok(googleOAuthConfigured());
  const { url, stateCookie } = googleRedirect("/starred");
  assert.match(url, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
  assert.match(url, /client_id=test-client-id/);
  assert.match(url, /scope=openid\+email\+profile/);
  assert.match(url, /redirect_uri=/, "the callback URL is part of the request");
  const state = unsign(stateCookie);
  assert.ok(state, "the state cookie is signed with SESSION_SECRET");
  assert.ok(state!.endsWith("|/starred"), "the state carries a sanitized return path");
});

test("unconfigured deployments answer the start route with a redirect, not an error", async () => {
  const id = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const secret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  delete process.env.GOOGLE_OAUTH_CLIENT_ID;
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  try {
    const res = await app.inject({ method: "GET", url: "/api/auth/google?return=/starred" });
    assert.equal(res.statusCode, 302);
    assert.match(res.headers.location as string, /error=google-unset/);
  } finally {
    process.env.GOOGLE_OAUTH_CLIENT_ID = id!;
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = secret!;
  }
});

test("a callback without a live state cookie is sent back to the login page", async () => {
  const res = await app.inject({ method: "GET", url: "/api/auth/google/callback?code=whatever&state=forged" });
  assert.equal(res.statusCode, 302);
  assert.equal(res.headers.location, "/login?error=google-failed");
});

test("a verified Google email merges into the same-email account; an unknown one creates a user", async () => {
  await sql`INSERT INTO users (email, email_verified, display_name) VALUES ('mirrored@example.com', true, '本地')`;
  const [before] = await sql<{ id: number }[]>`SELECT id FROM users WHERE email = 'mirrored@example.com'`;
  const merged = await upsertGoogleUser({ sub: "google-sub-1", email: "mirrored@example.com", name: "镜中人", picture: "https://lh3.example.com/a.png" });
  assert.equal(merged.id, before!.id, "same verified email, same account");
  const [row] = await sql<{ google_sub: string; display_name: string; avatar_url: string }[]>`
    SELECT google_sub, display_name, avatar_url FROM users WHERE email = 'mirrored@example.com'`;
  assert.equal(row!.google_sub, "google-sub-1");
  assert.equal(row!.display_name, "本地", "an existing display name is kept");
  assert.equal(row!.avatar_url, "https://lh3.example.com/a.png");

  const created = await upsertGoogleUser({ sub: "google-sub-2", email: "fresh@example.com", name: null, picture: null });
  const [fresh] = await sql<{ email: string; display_name: string; email_verified: boolean }[]>`
    SELECT email, display_name, email_verified FROM users WHERE google_sub = 'google-sub-2'`;
  assert.equal(fresh!.email, "fresh@example.com");
  assert.equal(fresh!.display_name, "fresh", "the local part stands in for a missing name");
  assert.equal(fresh!.email_verified, true);

  const again = await upsertGoogleUser({ sub: "google-sub-2", email: "fresh@example.com", name: null, picture: null });
  assert.equal(again.id, created.id, "the same subject signs into the same row");
});

test("user return paths stay on this site", () => {
  assert.equal(safeUserReturn("/starred?x=1"), "/starred?x=1");
  assert.equal(safeUserReturn("http://localhost:3000/starred"), "/starred", "a full same-origin URL keeps its path");
  assert.equal(safeUserReturn("https://evil.example.com/steal"), "/steal", "a foreign URL loses its origin: the redirect stays on this site");
  assert.equal(safeUserReturn("//evil.example.com"), "/");
  assert.equal(safeUserReturn("/\\evil.com"), "/", "a browser reads /\\host as protocol-relative");
  assert.equal(safeUserReturn("/\\/evil.example.com"), "/");
  assert.equal(safeUserReturn("javascript:alert(1)"), "/");
});
