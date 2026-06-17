import { useTranslation } from "@sonenta/react-i18next";
import { Brand } from "./Brand";
import { LangSwitcher } from "./LangSwitcher";

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-ink-950/75 border-b border-ink-800">
      <div className="mx-auto max-w-6xl flex items-center gap-6 px-6 h-14">
        <Brand />
        <span className="hidden md:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-300 px-2 py-0.5 border border-ink-700 rounded-sm">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          live demo
        </span>
        <nav className="ml-auto hidden md:flex items-center gap-6 text-sm text-ink-300">
          <a href="#features" className="hover:text-ink-50 transition-colors">
            {t("nav.product")}
          </a>
          <a href="#pricing" className="hover:text-ink-50 transition-colors">
            {t("nav.pricing")}
          </a>
          <a href="#docs" className="hover:text-ink-50 transition-colors">
            {t("nav.docs")}
          </a>
          <a
            href={`${import.meta.env.BASE_URL}quiz`}
            className="text-emerald-300 hover:text-emerald-200 transition-colors"
          >
            {t("nav.trivia")} →
          </a>
        </nav>
        <LangSwitcher />
        <a
          href="#signin"
          className="hidden sm:inline-flex items-center text-sm font-medium text-ink-300 hover:text-ink-50 transition-colors"
        >
          {t("nav.signin")} →
        </a>
      </div>
    </header>
  );
}
