// Reader sign-in: the email magic link (a one-shot link in a mail) and, when its OAuth client is
// configured, Google. The form posts straight to the API, which answers with a redirect either way
// — this page never learns whether a given address has an account.
import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/login";
import { SITE } from "@aihot/site";
import { Wordmark } from "@aihot/site/brand/Logo.tsx";
import { apiGet } from "../lib/api.server";
import { safeLoginReturn } from "../lib/return";
import { buttonClass } from "../components/ui/Controls";
import { localeFromMatches, translate, useI18n } from "../i18n";
import { pageMeta } from "../lib/seo";
import type { Screen } from "../components/shell/screens";

export const handle: Screen = { name: "登录" };

const ERRORS: Record<string, string> = {
  expired: "链接已失效或已被使用，请重新申请。",
  "too-many": "尝试次数太多，请 15 分钟后再试。",
  "bad-email": "邮箱格式不对，请检查后重试。",
  "mail-failed": "邮件发送失败，请稍后再试。",
  unset: "邮箱登录还没有配置，请稍后再试。",
  "google-failed": "Google 登录没有成功，请重试。",
  "google-unset": "Google 登录还没有配置。",
};

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  // Only same-site paths survive, so the page cannot become an open-redirect relay.
  const returnTo = safeLoginReturn(url.searchParams.get("return") ?? "/");
  const options = await apiGet<{ magic: boolean; google: boolean }>("/api/auth/user/options", { signal: request.signal }).catch(() => ({ magic: false, google: false }));
  return { returnTo, error: url.searchParams.get("error"), sent: url.searchParams.get("sent") === "1", ...options };
}

export function meta({ matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  return pageMeta({
    title: translate(locale, "登录"),
    description: translate(locale, "用邮箱或 Google 账号登录 {name}。", { name: SITE.name }),
    path: "/login",
    noindex: true,
    locale,
  });
}

export const headers: Route.HeadersFunction = () => ({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });

export default function Login() {
  const { returnTo, error, sent, magic, google } = useLoaderData<typeof loader>();
  const { t } = useI18n();
  const none = !magic && !google;
  const message = error ? (ERRORS[error] ?? t(ERRORS["google-failed"])) : null;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[360px]">
        <div className="flex items-center justify-center gap-2">
          <Wordmark size={28} className="text-ink" />
        </div>
        <p className="mt-2 text-center text-[13px] text-ink-3">{t("登录后，你的阅读足迹将可以跨设备保存。")}</p>
        {none ? (
          <div className="card mt-8 p-6">
            <p role="alert" className="text-[13px] leading-relaxed text-ink-3">
              {t("登录还没有开放，请稍后再来。")}
            </p>
          </div>
        ) : (
          <div className="card mt-8 p-6">
            {sent && !error && (
              <p role="status" className="mb-4 rounded-lg bg-ok-soft px-3 py-2 text-[12.5px] leading-relaxed text-ok-ink">
                {t("若该邮箱存在，确认邮件已发出——请在 10 分钟内查收并点击链接完成登录。")}
              </p>
            )}
            {message && (
              <p role="alert" className="mb-4 text-[12.5px] leading-relaxed text-hot">
                {message}
              </p>
            )}
            {magic && (
              <form method="post" action="/api/auth/magic/request">
                <input type="hidden" name="return" value={returnTo} />
                <label htmlFor="email" className="block text-[13px] font-medium text-ink-2">
                  {t("邮箱地址")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  autoFocus
                  placeholder="you@example.com"
                  className="mt-2 h-10 w-full rounded-full border border-line-strong bg-surface px-4 text-[14px] text-ink outline-none transition-colors focus:border-accent"
                />
                <button type="submit" className={`${buttonClass("primary", "lg")} mt-4 w-full`}>
                  {t("发送登录链接")}
                </button>
              </form>
            )}
            {magic && google && (
              <div className="my-4 flex items-center gap-3 text-[12px] text-ink-4">
                <span className="h-px flex-1 bg-line" />
                {t("或")}
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            {google && (
              <a href={`/api/auth/google?${new URLSearchParams({ return: returnTo })}`} className={`${buttonClass("secondary", "lg")} w-full`}>
                {t("用 Google 登录")}
              </a>
            )}
            <p className="mt-4 text-[11.5px] leading-relaxed text-ink-4">{t("登录即表示同意本站的条款与隐私说明。")}</p>
          </div>
        )}
        <p className="mt-6 text-center text-[12px] text-ink-4">
          <Link to="/" className="hover:text-ink-2">
            {t("回到 {name}", { name: SITE.name })}
          </Link>
        </p>
      </div>
    </div>
  );
}
