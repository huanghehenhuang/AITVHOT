// Visitor sign-in routes. The form posts are plain HTML navigations (like the admin's) and always
// answer with a redirect; the JSON endpoints under /api/auth/user/* are what reader pages call.
// The magic flow never reveals whether an address has an account: every request outcome a visitor
// can see is the same whichever address they typed.
import type { FastifyInstance } from "fastify";
import type { UserAuthOptions, UserMe } from "@aihot/contracts/user";
import { config } from "@aihot/backend/config";
import { cookie, parseCookies } from "@aihot/backend/admin/auth";
import {
  endUserSession,
  safeUserReturn,
  USER_SESSION_COOKIE,
  USER_SESSION_DAYS,
  USER_STATE_COOKIE,
  userPrincipal,
} from "@aihot/backend/user/auth";
import { consumeMagicLink, MagicRejected, requestMagicLink } from "@aihot/backend/user/magic";
import { completeGoogleLogin, googleOAuthConfigured, googleRedirect, GoogleRejected } from "@aihot/backend/user/google";
import { mailConfigured } from "@aihot/backend/notify/mail";
import { sendProblem } from "../http/respond.ts";

const secure = () => config.siteUrl.startsWith("https://");

const ERRORS: Record<string, string> = {
  expired: "链接已失效或已被使用，请重新申请。",
  "too-many": "尝试次数太多，请 15 分钟后再试。",
  "bad-email": "邮箱格式不对，请检查后重试。",
  "mail-failed": "邮件发送失败，请稍后再试。",
  unset: "邮箱登录还没有配置，请稍后再试。",
  "google-failed": "Google 登录没有成功，请重试。",
  "google-unset": "Google 登录还没有配置。",
};

const loginPage = (returnTo: string, error?: string, sent = false) =>
  `/login?${new URLSearchParams({ return: safeUserReturn(returnTo), ...(error ? { error } : {}), ...(sent ? { sent: "1" } : {}) })}`;

const MAGIC_ERROR_CODES = { bad_email: "bad-email", unset: "unset", rate_limited: "too-many", expired: "expired" } as const;

export function registerUserAuth(app: FastifyInstance) {
  app.get("/api/auth/user/options", async (_req, reply) => {
    const options: UserAuthOptions = { magic: mailConfigured(), google: googleOAuthConfigured() };
    return reply.header("Cache-Control", "no-store").send(options);
  });

  app.get("/api/auth/user/me", async (req, reply) => {
    const principal = await userPrincipal(req.headers.cookie);
    const user: UserMe | null = principal
      ? { email: principal.email, displayName: principal.displayName, avatarUrl: principal.avatarUrl, csrf: principal.csrf, method: principal.method }
      : null;
    return reply.header("Cache-Control", "no-store").send({ user });
  });

  app.post("/api/auth/user/logout", async (req, reply) => {
    const principal = await userPrincipal(req.headers.cookie);
    if (!principal) {
      return sendProblem(req, reply, { status: 401, code: "unauthorized", detail: "Not signed in." });
    }
    if (req.headers["x-csrf-token"] !== principal.csrf) {
      return sendProblem(req, reply, { status: 403, code: "forbidden", detail: "Missing or stale CSRF token." });
    }
    await endUserSession(req.headers.cookie);
    return reply.header("Set-Cookie", cookie(USER_SESSION_COOKIE, "", 0, secure())).header("Cache-Control", "no-store").send({ ok: true });
  });

  // The magic-link form posts as a plain HTML form; only this route reads that format.
  app.register(async (form) => {
    form.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string", bodyLimit: 16 * 1024 }, (_req, body, done) => {
      done(null, Object.fromEntries(new URLSearchParams(String(body))));
    });
    form.post("/api/auth/magic/request", async (req, reply) => {
      const b = (req.body ?? {}) as Record<string, string>;
      const returnTo = String(b.return ?? "/");
      reply.header("Cache-Control", "no-store");
      try {
        await requestMagicLink(String(b.email ?? ""), returnTo, req.ip, req.headers["user-agent"]);
        return reply.redirect(loginPage(returnTo, undefined, true), 303);
      } catch (error) {
        if (!(error instanceof MagicRejected)) {
          req.log.error({ err: error }, "magic link request failed");
          return reply.redirect(loginPage(returnTo, "mail-failed"), 303);
        }
        // A failed send answers like a success: whether mail went out for one address must not
        // differ visibly from another, or same-domain addresses could be probed for existence.
        if (error.reason === "send_failed") {
          req.log.warn({ email_domain: String(b.email ?? "").split("@")[1] }, "login mail failed to send");
          return reply.redirect(loginPage(returnTo, undefined, true), 303);
        }
        return reply.redirect(loginPage(returnTo, MAGIC_ERROR_CODES[error.reason]), 303);
      }
    });
  });

  app.get("/api/auth/magic/confirm", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const returnTo = safeUserReturn(String(q.return ?? "/"));
    reply.header("Cache-Control", "no-store");
    try {
      const { sessionToken } = await consumeMagicLink(String(q.token ?? ""), req.headers["user-agent"]);
      reply.header("Set-Cookie", cookie(USER_SESSION_COOKIE, sessionToken, USER_SESSION_DAYS * 86400, secure()));
      return reply.redirect(returnTo, 303);
    } catch (error) {
      if (!(error instanceof MagicRejected)) req.log.error({ err: error }, "magic link confirm failed");
      return reply.redirect(loginPage(returnTo, "expired"), 303);
    }
  });

  app.get("/api/auth/google", async (req, reply) => {
    const q = req.query as Record<string, string>;
    const returnTo = String(q.return ?? "/");
    reply.header("Cache-Control", "no-store");
    if (!googleOAuthConfigured()) return reply.redirect(loginPage(returnTo, "google-unset"), 302);
    const { url, stateCookie } = googleRedirect(returnTo);
    reply.header("Set-Cookie", cookie(USER_STATE_COOKIE, stateCookie, 600, secure()));
    return reply.redirect(url, 302);
  });

  app.get("/api/auth/google/callback", async (req, reply) => {
    const q = req.query as Record<string, string>;
    reply.header("Cache-Control", "no-store");
    try {
      const { sessionToken, returnTo } = await completeGoogleLogin(String(q.code ?? ""), String(q.state ?? ""), parseCookies(req.headers.cookie)[USER_STATE_COOKIE], req.headers["user-agent"]);
      reply.header("Set-Cookie", [cookie(USER_SESSION_COOKIE, sessionToken, USER_SESSION_DAYS * 86400, secure()), cookie(USER_STATE_COOKIE, "", 0, secure())]);
      return reply.redirect(safeUserReturn(returnTo), 302);
    } catch (error) {
      if (!(error instanceof GoogleRejected)) req.log.error({ err: error }, "google login failed");
      return reply.redirect("/login?error=google-failed", 302);
    }
  });
}
