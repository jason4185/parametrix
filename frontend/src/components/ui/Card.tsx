type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={[
        "rounded-xl border border-white/10 bg-[#0B171B]/85 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur transition duration-200 hover:border-white/15",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
