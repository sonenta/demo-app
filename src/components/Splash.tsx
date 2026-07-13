import { useEffect, useState } from "react";

/**
 * First-paint cover: hides the page for a beat while the locale bundle loads,
 * then fades out. We always render the page tree behind it so the SDK kicks
 * off the fetch immediately — Splash is purely cosmetic.
 *
 * It is also CAPPED, and that matters more than the cosmetics. `ready` waits
 * on a network fetch, so an uncapped splash hands the network the power to
 * hide the entire page indefinitely: on a 2G-class connection the demo showed
 * nothing at all for as long as we measured. A visitor cannot tell a slow app
 * from a broken one, and they leave. After MAX_HOLD_MS we reveal the page
 * regardless — a page with a few keys still resolving beats no page at all,
 * and every control (including the language switcher) works meanwhile.
 */
const MAX_HOLD_MS = 1200;

export function Splash({ ready }: { ready: boolean }) {
  const [mounted, setMounted] = useState(true);
  const [fading, setFading] = useState(false);
  const [expired, setExpired] = useState(false);

  // The network never gets to hide the page for longer than this.
  useEffect(() => {
    const t = window.setTimeout(() => setExpired(true), MAX_HOLD_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!(ready || expired) || fading) return;
    setFading(true);
    const t = window.setTimeout(() => setMounted(false), 320);
    return () => window.clearTimeout(t);
  }, [ready, expired, fading]);

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
