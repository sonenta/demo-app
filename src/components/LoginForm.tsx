import { useState } from "react";
import { useTranslation } from "@sonenta/react-i18next";

/**
 * Minimal sign-in form for the demo. Every user-facing string is a managed
 * Sonenta key rendered through `t()` — no hardcoded copy — so the label set
 * stays translatable (FR/EN/ES) and shipped via the CDN like the rest of the
 * app. The "Remember me" label is `auth.remember_me`.
 */
export function LoginForm() {
  const { t } = useTranslation();
  const [remember, setRemember] = useState(true);

  return (
    <form
      id="signin"
      className="mx-auto w-full max-w-sm rounded-lg border border-ink-800 bg-ink-950/60 p-6 flex flex-col gap-4"
      onSubmit={(e) => e.preventDefault()}
    >
      <h2 className="text-lg font-semibold text-ink-50">{t("nav.signin")}</h2>

      <label className="flex flex-col gap-1 text-sm text-ink-300">
        {t("auth.email.label")}
        <input
          type="email"
          autoComplete="email"
          aria-label={t("auth.email.label")}
          className="rounded-sm border border-ink-700 bg-ink-900 px-3 py-2 text-ink-50 focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-ink-300">
        {t("auth.password.label")}
        <input
          type="password"
          autoComplete="current-password"
          aria-label={t("auth.password.label")}
          className="rounded-sm border border-ink-700 bg-ink-900 px-3 py-2 text-ink-50 focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-ink-300 select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 rounded-sm border-ink-700 bg-ink-900 text-emerald-500 focus:ring-emerald-500"
        />
        {t("auth.remember_me")}
      </label>

      <button
        type="submit"
        className="mt-1 inline-flex items-center justify-center rounded-sm bg-emerald-500 px-4 py-2 text-sm font-medium text-ink-950 hover:bg-emerald-400 transition-colors"
      >
        {t("nav.signin")}
      </button>
    </form>
  );
}
