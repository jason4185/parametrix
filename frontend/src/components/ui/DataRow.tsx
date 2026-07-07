type DataRowProps = {
  label: string;
  value: React.ReactNode;
};

export function DataRow({ label, value }: DataRowProps) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-white/10 py-3 first:pt-0 last:border-b-0 last:pb-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-text">{value}</dd>
    </div>
  );
}
