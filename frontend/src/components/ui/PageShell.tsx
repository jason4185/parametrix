type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide";
};

export function PageShell({
  children,
  className = "",
  size = "default",
}: PageShellProps) {
  return (
    <div
      className={[
        "mx-auto w-full",
        size === "wide" ? "max-w-7xl" : "max-w-6xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
