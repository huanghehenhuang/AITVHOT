// Visitor sessions: the hashed opaque token, the per-request binding re-check (a tampered or
// unbound session is deleted, not merely refused), expiry, and the logout route's CSRF guard.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { createSession, endUserSession, userPrincipal, USER_SESSION_COOKIE } from "@aihot/backend/user/auth";
import { buildApp } from "../apps/api/src/app.ts";

const app = await buildApp();
after(async () => {
  await app.close();
  await closeDb();
});

async function testUser(email: string): Promise<number> {
  const [row] = await sql<{ id: number }[]>`INSERT INTO users (email, email_verified, display_name) VALUES (${email}, true, ${email}) RETURNING id`;
  return row!.id;
}

const cookieOf = (token: string) => `${USER_SESSION_COOKIE}=${token}`;

test("a live session resolves to its user and carries a CSRF token", async () => {
  const userId = await testUser("session@example.com");
  const token = await createSession(userId, "test-agent", "magic", "session@example.com");
  const principal = await userPrincipal(cookieOf(token));
  assert.ok(principal);
  assert.equal(principal!.userId, userId);
  assert.equal(principal!.email, "session@example.com");
  assert.equal(principal!.method, "magic");
  assert.ok(principal!.csrf.length >= 20);
  assert.deepEqual(await userPrincipal(`${cookieOf(token)}; other=1`), principal, "other cookies do not disturb the lookup");
});

test("a session whose binding no longer matches is deleted on sight", async () => {
  const userId = await testUser("tampered@example.com");
  const token = await createSession(userId, undefined, "magic", "tampered@example.com");
  await sql`UPDATE user_sessions SET auth_binding = ${"0".repeat(64)} WHERE user_id = ${userId}`;
  assert.equal(await userPrincipal(cookieOf(token)), null, "a forged binding is refused");
  const [left] = await sql`SELECT count(*)::int AS n FROM user_sessions WHERE user_id = ${userId}`;
  assert.equal(left!.n, 0, "and the row is gone for good");
});

test("a session bound to a missing identity is invalid — a magic session needs the email, a Google one the subject", async () => {
  const userId = await testUser("unbound@example.com");
  const token = await createSession(userId, undefined, "google", "some-google-sub");
  await sql`UPDATE users SET google_sub = NULL WHERE id = ${userId}`;
  assert.equal(await userPrincipal(cookieOf(token)), null, "no subject, no binding, no session");
  const [left] = await sql`SELECT count(*)::int AS n FROM user_sessions WHERE user_id = ${userId}`;
  assert.equal(left!.n, 0);
});

test("an expired session stops resolving", async () => {
  const userId = await testUser("expired@example.com");
  const token = await createSession(userId, undefined, "magic", "expired@example.com");
  await sql`UPDATE user_sessions SET expires_at = now() - interval '1 minute' WHERE user_id = ${userId}`;
  assert.equal(await userPrincipal(cookieOf(token)), null);
});

test("logout needs the session's CSRF token and ends the session", async () => {
  const userId = await testUser("logout@example.com");
  const token = await createSession(userId, undefined, "magic", "logout@example.com");
  const cookie = cookieOf(token);
  const [meRow] = await sql`SELECT csrf_token FROM user_sessions WHERE user_id = ${userId}`;
  const csrf = meRow!.csrf_token;

  const anonymous = await app.inject({ method: "POST", url: "/api/auth/user/logout" });
  assert.equal(anonymous.statusCode, 401, "no session, nothing to log out");

  const noToken = await app.inject({ method: "POST", url: "/api/auth/user/logout", headers: { cookie } });
  assert.equal(noToken.statusCode, 403, "a write without the CSRF token is refused");

  const wrong = await app.inject({ method: "POST", url: "/api/auth/user/logout", headers: { cookie, "x-csrf-token": `${csrf}x` } });
  assert.equal(wrong.statusCode, 403);

  const ok = await app.inject({ method: "POST", url: "/api/auth/user/logout", headers: { cookie, "x-csrf-token": csrf } });
  assert.equal(ok.statusCode, 200);
  assert.match(String(ok.headers["set-cookie"]), /Max-Age=0/, "the cookie is cleared");
  assert.equal(await userPrincipal(cookie), null, "the token no longer resolves");
});

test("endUserSession works from the cookie header alone", async () => {
  const userId = await testUser("endsession@example.com");
  const token = await createSession(userId, undefined, "magic", "endsession@example.com");
  await endUserSession(cookieOf(token));
  const [left] = await sql`SELECT count(*)::int AS n FROM user_sessions WHERE user_id = ${userId}`;
  assert.equal(left!.n, 0);
});
