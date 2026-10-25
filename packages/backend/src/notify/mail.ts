// Login emails over SMTP (nodemailer). SMTP speaks directly to the mail host — measured 2026-10-25:
// smtp.qq.com and smtp.163.com answer on 465/587 from the production host, so no overseas mail API
// rides the login path. The transport is built lazily from the integrations credentials; tests swap
// it out through setMailTransportForTests instead of talking to a real server.
import { SITE } from "@aihot/site";
import { credential } from "../config.ts";
import nodemailer from "nodemailer";

export interface MailTransport {
  sendMail(options: { from: string; to: string; subject: string; text: string; html: string }): Promise<unknown>;
}

let cached: MailTransport | undefined;
let testTransport: MailTransport | null | undefined;

/** Tests replace the transport (null counts as a replacement that refuses to send). */
export function setMailTransportForTests(transport: MailTransport | null): void {
  testTransport = transport;
  cached = undefined;
}

export function mailConfigured(): boolean {
  return !!credential("integrations", "SMTP_HOST") && !!credential("integrations", "SMTP_USER") && !!credential("integrations", "SMTP_PASS");
}

function transport(): MailTransport | null {
  if (testTransport !== undefined) return testTransport;
  cached ??= buildTransport();
  return cached!;
}

function buildTransport(): MailTransport {
  const host = credential("integrations", "SMTP_HOST")!;
  const port = Number(credential("integrations", "SMTP_PORT") ?? "465");
  const user = credential("integrations", "SMTP_USER")!;
  const pass = credential("integrations", "SMTP_PASS")!;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

export function loginMailContent(url: string): { subject: string; text: string; html: string } {
  const subject = `登录 ${SITE.name}`;
  const text = [
    `有人请求用这个邮箱登录 ${SITE.name}。如果是你，10 分钟内点下面的链接完成登录：`,
    "",
    url,
    "",
    "链接只能用一次。如果不是你在申请登录，请忽略这封邮件。",
  ].join("\n");
  const html = [
    `<p style="font:15px/1.6 system-ui,sans-serif">有人请求用这个邮箱登录 <strong>${SITE.name}</strong>。如果是你，10 分钟内点下面的链接完成登录：</p>`,
    `<p style="font:15px/1.6 system-ui,sans-serif"><a href="${url}">${url}</a></p>`,
    `<p style="font:13px/1.6 system-ui,sans-serif;color:#666">链接只能用一次。如果不是你在申请登录，请忽略这封邮件。</p>`,
  ].join("\n");
  return { subject, text, html };
}

export async function sendLoginMail(options: { to: string; url: string }): Promise<void> {
  const sender = transport();
  if (!sender) throw new Error("SMTP is not configured");
  const { subject, text, html } = loginMailContent(options.url);
  await sender.sendMail({
    from: credential("integrations", "MAIL_FROM") ?? credential("integrations", "SMTP_USER")!,
    to: options.to,
    subject,
    text,
    html,
  });
}
