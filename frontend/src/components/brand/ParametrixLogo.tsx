type ParametrixLogoProps = {
  className?: string;
};

export function ParametrixLogo({ className = "" }: ParametrixLogoProps) {
  return (
    <div className={["flex items-center gap-3", className].join(" ")}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-md border border-cyan/50 bg-card">
        <span className="absolute inset-1 rounded bg-cyan/20 blur-md" />
        <svg
          aria-hidden="true"
          className="relative h-6 w-6"
          fill="none"
          viewBox="0 0 32 32"
        >
          <path
            d="M6 20.5 13.5 8l5 8 3-4.5L26 20.5"
            stroke="#00E5FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.4"
          />
          <path
            d="M7 23h18"
            stroke="#7DD3FC"
            strokeLinecap="round"
            strokeWidth="2.4"
          />
          <circle cx="22" cy="11" fill="#FFB020" r="2" />
        </svg>
      </span>
      <span className="text-lg font-semibold text-text">Parametrix</span>
    </div>
  );
}
