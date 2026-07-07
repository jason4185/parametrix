type ActionBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function ActionBar({ children, className = "" }: ActionBarProps) {
  return (
    <div
      className={[
        "flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
