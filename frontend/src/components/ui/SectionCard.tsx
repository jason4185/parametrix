type SectionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionCard({ children, className = "" }: SectionCardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-white/10 bg-white/[0.035] shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
