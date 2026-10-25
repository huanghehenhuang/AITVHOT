// The email magic-link flow over the real routes: request (rate-limited, enumeration-safe), the
// one-shot confirm, the session it starts, and the /me endpoint that reads it.
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { sha256 } from "@aihot/backend/lib/ids";
import { setMailTransportForTests, type MailTransport } from "@aihot/backend/notify/mail";
import { buildApp } from "../apps/api/src/app.ts";

process.env.SMTP_HOST ??= "smtp.example.com";
process.env.SMTP_USER ??= "login@example.com";
process.env.SMTP_PASS ??= "test-auth-code";

let captured: { to: string; text: string; html: string } | null = null;
const transport: MailTransport = {
  sendMail: async (options) => {
    captured = { to: options.to, text: options.text, html: options.html };
    return {};
  },
};
setMailTransportForTests(transport);

const app = await buildApp();
after(async () => {
  await app.close();
  await closeDb();
});

const sessionUser = async (setCookie: unknown): Promise<number> => {
  const token = String(setCookie).split(";")[0]!.split("=")[1]!;
  const [row] = await sql<{ user_id: number }[]>`SELECT user_id FROM user_sessions WHERE id_hash = ${sha256(token)}`;
  return row!.user_id;
};

const post = (body: Record<string, string>) =>
  app.inject({ method: "POST", url: "/api/auth/magic/request", payload: new URLSearchParams(body).toString(), headers: { "content-type": "application/x-www-form-urlencoded" } });

const tokenIn = (mail: { text: string }) => new URL(/https?:\/\/\S+/.exec(mail.text)![0]).searchParams.get("token")!;

test("requesting a link mails a one-shot token and answers the same for any address", async () => {
  const first = await post({ email: " Reader@Example.COM ", return: "/starred" });
  assert.equal(first.statusCode, 303);
  assert.match(first.headers.location as string, /\?return=%2Fstarred&sent=1$/);
  assert.equal(captured!.to, "reader@example.com", "the address is normalized");
  const [row] = await sql`SELECT email, expires_at > now() AS live, used_at FROM login_tokens WHERE email = 'reader@example.com'`;
  assert.ok(row!.live, "the token lives for its whole window");
  assert.equal(row!.used_at, null);

  const unknown = await post({ email: "nobody-has-this@example.com", return: "/" });
  assert.equal(unknown.statusCode, 303);
  const firstParams = new URL(first.headers.location as string, "http://x").searchParams;
  const unknownParams = new URL(unknown.headers.location as string, "http://x").searchParams;
  assert.equal(unknownParams.get("sent"), firstParams.get("sent"), "an unknown address looks the same");
  assert.equal(unknownParams.get("error"), null);
});

test("the confirm link starts a session once and only once", async () => {
  await post({ email: "once@example.com", return: "/" });
  const token = tokenIn(captured!);

  const confirm = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(token)}&return=${encodeURIComponent("/starred")}` });
  assert.equal(confirm.statusCode, 303);
  assert.equal(confirm.headers.location, "/starred");
  const setCookie = String(confirm.headers["set-cookie"]);
  assert.match(setCookie, /aihot_user=/);
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Lax/);
  assert.doesNotMatch(setCookie, /Secure/, "plain-http test site sends no Secure flag");

  const cookie = setCookie.split(";")[0]!;
  const me = await app.inject({ method: "GET", url: "/api/auth/user/me", headers: { cookie } });
  const { user } = me.json() as { user: { email: string; csrf: string; method: string } | null };
  assert.ok(user, "the confirm started a live session");
  assert.equal(user!.email, "once@example.com");
  assert.equal(user!.method, "magic");
  assert.ok(user!.csrf);

  const again = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(token)}&return=/` });
  assert.equal(again.statusCode, 303);
  assert.match(again.headers.location as string, /error=expired/, "a used token is spent");

  const tampered = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(`${token}x`)}&return=/` });
  assert.match(tampered.headers.location as string, /error=expired/, "another token matches no row");
});

test("an expired token is refused", async () => {
  await post({ email: "late@example.com", return: "/" });
  const token = tokenIn(captured!);
  await sql`UPDATE login_tokens SET expires_at = now() - interval '1 minute' WHERE email = 'late@example.com'`;
  const confirm = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(token)}&return=/` });
  assert.match(confirm.headers.location as string, /error=expired/);
  const [user] = await sql`SELECT id FROM users WHERE email = 'late@example.com'`;
  assert.equal(user, undefined, "no account was created from an expired link");
});

test("the same address signs back into the same account", async () => {
  await post({ email: "returning@example.com", return: "/" });
  const first = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(tokenIn(captured!))}&return=/` });
  const firstUserId = await sessionUser(first.headers["set-cookie"]);
  await post({ email: "RETURNING@example.com", return: "/" });
  const second = await app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(tokenIn(captured!))}&return=/` });
  const secondUserId = await sessionUser(second.headers["set-cookie"]);
  assert.equal(secondUserId, firstUserId, "case-insensitive same email, same user");
  const [count] = await sql`SELECT count(*)::int AS n FROM users WHERE email = 'returning@example.com'`;
  assert.equal(count!.n, 1);
});

test("more than three links to one address in the window are refused", async () => {
  const email = "flood@example.com";
  for (let i = 0; i < 3; i++) {
    const ok = await post({ email, return: "/" });
    assert.equal(ok.statusCode, 303);
    assert.doesNotMatch(ok.headers.location as string, /error=/);
  }
  const fourth = await post({ email, return: "/" });
  assert.match(fourth.headers.location as string, /error=too-many/, "the fourth request in the window is over the limit");
  const [count] = await sql`SELECT count(*)::int AS n FROM login_tokens WHERE email = ${email}`;
  assert.equal(count!.n, 3, "the refused request left no token");
});

test("two concurrent confirms of one token start exactly one session", async () => {
  await post({ email: "race@example.com", return: "/" });
  const token = tokenIn(captured!);
  const [a, b] = await Promise.all([
    app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(token)}&return=/` }),
    app.inject({ method: "GET", url: `/api/auth/magic/confirm?token=${encodeURIComponent(token)}&return=/` }),
  ]);
  const started = [a, b].filter((res) => !String(res.headers.location).includes("error=expired"));
  assert.equal(started.length, 1, "only one of the racing confirms may consume the token");
  const [count] = await sql`SELECT count(*)::int AS n FROM user_sessions WHERE user_id = (SELECT id FROM users WHERE email = 'race@example.com')`;
  assert.equal(count!.n, 1);
});

test("a failed send looks like a success from the outside", async () => {
  // Earlier tests filled the per-IP window; the ledger is the limit, so empty it here first.
  await sql`DELETE FROM login_tokens`;
  setMailTransportForTests({ sendMail: async () => { throw new Error("smtp down"); } });
  try {
    const res = await post({ email: "smtpdown@example.com", return: "/" });
    assert.equal(res.statusCode, 303);
    assert.doesNotMatch(res.headers.location as string, /error=/, "send failures must not be visible to the visitor");
    assert.match(res.headers.location as string, /sent=1/);
  } finally {
    setMailTransportForTests(transport);
  }
});

test("a malformed address is refused without leaving a row", async () => {
  const bad = await post({ email: "not-an-address", return: "/" });
  assert.match(bad.headers.location as string, /error=bad-email/);
  const [count] = await sql`SELECT count(*)::int AS n FROM login_tokens WHERE email = 'not-an-address'`;
  assert.equal(count!.n, 0);
});
