import { AsyncLocalStorage } from "node:async_hooks";
import type { IncomingMessage } from "node:http";
import { resolveLocale, type Locale } from "../i18n/locale.ts";

interface LocaleContext { locale: Locale; complete: boolean }
// The production host and the compiled React Router build share this request-local store.
const key = Symbol.for("aihot.localeContext");
const shared = globalThis as typeof globalThis & { [key]?: AsyncLocalStorage<LocaleContext> };
export const localeContext = shared[key] ??= new AsyncLocalStorage<LocaleContext>();

export function incomingLocale(req: IncomingMessage): Locale {
  const headers = new Headers();
  for (const name of ["cookie", "accept-language", "user-agent", "cf-ipcountry"]) {
    const value = req.headers[name];
    if (typeof value === "string") headers.set(name, value);
  }
  return resolveLocale(new Request(`http://web.local${req.url ?? "/"}`, { headers }), process.env.TRUST_PROXY === "true");
}
