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
        <text
          x="14.4"
          y="24.3"
          textAnchor="middle"
          fontFamily="'Times New Roman', Times, Georgia, serif"
          fontSize="25.6"
          fontWeight="700"
          fill="#10b981"
          stroke="#10b981"
          strokeWidth="0.96"
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          S
        </text>
        <circle cx="25.6" cy="22.4" r="2.24" fill="#34d399" />
      </svg>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink-50">
        Sonenta
      </span>
    </span>
  );
}
