import { useTranslation } from "@sonenta/react-i18next";
import { Brand } from "./Brand";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-ink-800">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-wrap items-center gap-6">
        <Brand size={22} />
        <p className="text-ink-300 text-sm">{t("footer.tagline")}</p>
        <div className="ml-auto flex items-center gap-5 text-xs text-ink-300 mono">
          <a
            href="https://github.com/sonenta/demo-app"
            className="hover:text-ink-50 transition-colors"
          >
            {t("footer.repo")}
          </a>
          <span className="border-l border-ink-800 h-4" />
          <span>{t("footer.demo")}</span>
        </div>
      </div>
    </footer>
  );
}
