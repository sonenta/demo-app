import { useEffect, useState } from "react";

/**
 * First-paint cover: holds the page hidden (visually) for a beat while the
 * locale bundle loads, then fades out. We always render the page tree behind
 * it so the SDK kicks off the fetch immediately — Splash is purely cosmetic.
 */
export function Splash({ ready }: { ready: boolean }) {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!ready || fading) return;
    setFading(true);
    const t = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [ready, fading]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!ready}
      className={[
        "fixed inset-0 z-50 grid place-items-center bg-ink-950 transition-opacity duration-300",
        fading ? "opacity-0 pointer-events-none" : "opacity-100",
      ].join(" ")}
    >
      <div className="flex flex-col items-center gap-5">
        <svg
          aria-hidden
          viewBox="0 0 32 32"
          width={48}
          height={48}
          className="splash-logo"
        >
          <rect width="32" height="32" rx="7" fill="#0e1015" />
          <path
            d="M9 9.5l5.6 12.5h2L22 9.5h-2.5l-4 9.4-3.9-9.4z"
            fill="#10b981"
          />
        </svg>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-ink-300">
          loading bundles
        </span>
        <span className="block h-px w-24 bg-ink-800 overflow-hidden rounded-full">
          <span className="block h-full w-1/2 bg-emerald-500 splash-bar" />
        </span>
      </div>
    </div>
  );
}
