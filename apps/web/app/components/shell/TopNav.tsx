import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { SITE } from "@aihot/site";
import { Wordmark } from "@aihot/site/brand/Logo.tsx";
import { useI18n } from "../../i18n";
import { DesignAsset } from "../ui/DesignAsset";
import { openSearch } from "../../features/search/SearchOverlay";
import { sidebar, sidebarIsActive } from "./nav";
import { SearchField } from "../../features/feed/Filters";
import { ThemeSwitch } from "./ThemeSwitch";
import { LocaleSwitch } from "./LocaleSwitch";

export function TopNav({ showMobile = false }: { showMobile?: boolean }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const menu = useRef<HTMLDetailsElement>(null);
  const sections = sidebar();
  const primary = sections[0]?.items.filter((item) => item.to !== "/starred") ?? [];
  useEffect(() => { if (menu.current) menu.current.open = false; }, [pathname]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && menu.current?.open) { menu.current.open = false; menu.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape); };
  }, []);
  return (
    <header className={`editorial-topbar ${showMobile ? "" : "desktop-topbar"}`}>
      <div className="editorial-topbar-inner">
        <Link to="/" className="editorial-wordmark" aria-label={`${SITE.name} ${t("首页")}`}><Wordmark size={52} title="AITVHOT.TOP" /></Link>
        <nav className="editorial-primary-nav" aria-label={t("主导航")}>
          {primary.map((item) => <Link key={item.to} to={item.to} prefetch="intent" aria-current={sidebarIsActive(item, pathname) ? "page" : undefined}>{t(item.to === "/all" ? "全部动态" : item.to === "/daily" ? "日报" : item.label)}</Link>)}
        </nav>
        <div className="editorial-header-search"><SearchField /></div>
        <div className="editorial-header-theme"><ThemeSwitch compact /></div>
        <button type="button" className="editorial-mobile-search" aria-label={t("搜索")} onClick={(event) => openSearch("", event.currentTarget)}><DesignAsset name="search" /></button>
        <details ref={menu} className="editorial-menu">
          <summary aria-label={t("更多操作")}><DesignAsset name="menu" /></summary>
          <div className="editorial-menu-panel">
            {sections.map((section) => <nav key={section.title} aria-label={t(section.title)}><p>{t(section.title)}</p>{section.items.map((item) => <Link key={item.to} to={item.to} aria-current={sidebarIsActive(item, pathname) ? "page" : undefined} onClick={() => { if (menu.current) menu.current.open = false; }}>{t(item.label)}</Link>)}</nav>)}
            <div className="editorial-menu-settings"><LocaleSwitch /><ThemeSwitch /></div>
          </div>
        </details>
      </div>
    </header>
  );
}
