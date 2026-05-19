export function Brand({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="shrink-0"
      >
        <rect width="32" height="32" rx="7" fill="#0e1015" />
        <path
          d="M9 9.5l5.6 12.5h2L22 9.5h-2.5l-4 9.4-3.9-9.4z"
          fill="#10b981"
        />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink-50">
        Verbumia
      </span>
    </span>
  );
}
