type BadgeProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "cyan" | "neutral" | "amber" | "coral";
};

const variants = {
  cyan: "border-cyan/40 bg-cyan/10 text-cyan",
  neutral: "border-white/12 bg-white/[0.06] text-slate-200",
  amber: "border-amber/40 bg-amber/10 text-amber",
  coral: "border-coral/40 bg-coral/10 text-coral",
};

export function Badge({
  children,
  className = "",
  variant = "cyan",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold",
        variants[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </span>
  );
}
