import Link from "next/link";

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost";
};

const variants = {
  primary:
    "border-cyan/60 bg-cyan text-base hover:border-cyan hover:bg-cyan/90 hover:shadow-[0_16px_40px_rgba(0,229,255,0.14)] active:scale-[0.98]",
  secondary:
    "border-white/12 bg-white/[0.06] text-text hover:border-cyan/35 hover:bg-cyan/10 active:scale-[0.98]",
  ghost:
    "border-transparent bg-transparent text-cyan hover:bg-cyan/10 active:scale-[0.98]",
};

export function Button({
  children,
  className = "",
  disabled = false,
  href,
  onClick,
  type = "button",
  variant = "primary",
}: ButtonProps) {
  const buttonClassName = [
    "inline-flex min-h-11 items-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan focus:ring-offset-2 focus:ring-offset-base disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link aria-disabled={disabled} className={buttonClassName} href={href}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={buttonClassName}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
