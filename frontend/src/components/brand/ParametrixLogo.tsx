type LogoSize = "lg" | "md" | "sm";

type ParametrixLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: LogoSize;
};

const sizeStyles: Record<
  LogoSize,
  { gap: string; mark: string; text: string }
> = {
  lg: {
    gap: "gap-3.5",
    mark: "h-12 w-12",
    text: "text-2xl",
  },
  md: {
    gap: "gap-3",
    mark: "h-10 w-10",
    text: "text-lg",
  },
  sm: {
    gap: "gap-2.5",
    mark: "h-8 w-8",
    text: "text-base",
  },
};

export function ParametrixLogo({
  className = "",
  showWordmark = true,
  size = "md",
}: ParametrixLogoProps) {
  const styles = sizeStyles[size];

  return (
    <div
      aria-label="Parametrix"
      className={["inline-flex items-center", styles.gap, className]
        .filter(Boolean)
        .join(" ")}
      role="img"
    >
      <span
        className={[
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cyan/35 bg-[#071316] shadow-[0_12px_36px_rgba(0,229,255,0.12)]",
          styles.mark,
        ].join(" ")}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_32%_22%,rgba(0,229,255,0.22),transparent_45%),linear-gradient(145deg,rgba(255,255,255,0.08),transparent_42%)]" />
        <svg
          aria-hidden="true"
          className="relative h-[72%] w-[72%]"
          fill="none"
          viewBox="0 0 64 64"
        >
          <path
            d="M32 7.5 48.5 14v16.4c0 11.3-6.8 20.7-16.5 25.6-9.7-4.9-16.5-14.3-16.5-25.6V14L32 7.5Z"
            stroke="#7DD3FC"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
          <path
            d="M25 43V21.5h10.2c5.8 0 9.6 3.8 9.6 8.7s-3.8 8.8-9.6 8.8H25"
            stroke="#00E5FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.5"
          />
          <path
            d="M18.5 34.5h7.1l3.4-7.2 5.6 14.2 4-8.2h7"
            stroke="#E0F7FF"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.5"
          />
          <path
            d="M39.5 17.8c1.7-2.6 4.8-3.9 8.3-3.1"
            stroke="#00E5FF"
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={[
            "font-semibold tracking-[0.01em] text-text",
            styles.text,
          ].join(" ")}
        >
          Parametrix
        </span>
      ) : null}
    </div>
  );
}
