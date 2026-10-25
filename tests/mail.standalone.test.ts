// The login mail's content and the SMTP configuration check — no database needed.
import assert from "node:assert/strict";
import { test } from "node:test";
import { loginMailContent, mailConfigured } from "@aihot/backend/notify/mail";

test("the login mail carries the one-shot link and the ignore note", () => {
  const url = "https://aitvhot.top/api/auth/magic/confirm?token=t0k3n&return=%2Fstarred";
  const mail = loginMailContent(url);
  assert.match(mail.subject, /登录/);
  assert.ok(mail.text.includes(url), "text carries the link verbatim");
  assert.ok(mail.html.includes(`href="${url}"`), "html links the url");
  assert.ok(mail.text.includes("10 分钟"), "text states the expiry");
  assert.ok(mail.text.includes("忽略"), "text tells the uninvited to ignore");
});

test("SMTP sign-in is offered only when host, user and password are all set", () => {
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  assert.equal(mailConfigured(), false);
  process.env.SMTP_HOST = "smtp.qq.com";
  process.env.SMTP_USER = "a@qq.com";
  assert.equal(mailConfigured(), false, "no password yet");
  process.env.SMTP_PASS = "auth-code";
  assert.equal(mailConfigured(), true);
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
});
