import { useI18n, localeCookie, type Locale } from "../../i18n";

const OPTIONS: Array<{ key: Locale; label: string }> = [
  { key: "zh", label: "中文" },
  { key: "en", label: "EN" },
];

/** Chinese / English. A full load so the server renders the chosen language (root data does not revalidate). */
export function LocaleSwitch({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const index = Math.max(0, OPTIONS.findIndex((o) => o.key === locale));
  const choose = (next: Locale) => {
    if (next === locale) return;
    document.cookie = localeCookie(next);
    const url = new URL(window.location.href);
    if (next === "en") url.searchParams.set("lang", "en");
    else url.searchParams.delete("lang");
    window.location.assign(url.pathname + url.search + url.hash);
  };
  return (
    <div role="radiogroup" aria-label={t("语言")} className={`relative grid h-[34px] grid-cols-2 rounded-full border border-line bg-bg-sunk p-[3px] ${className}`}>
      <span
        aria-hidden="true"
        className="absolute inset-y-[3px] left-[3px] w-[calc((100%-6px)/2)] rounded-full border border-line bg-surface shadow-[var(--shadow-card)] transition-transform duration-200 ease-[var(--ease-out-quart)]"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={locale === o.key}
          onClick={() => choose(o.key)}
          className={`relative z-10 rounded-full text-[12px] font-semibold transition-colors duration-150 ${locale === o.key ? "text-ink" : "text-ink-4 hover:text-ink-2"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
