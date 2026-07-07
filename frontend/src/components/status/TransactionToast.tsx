"use client";

type TransactionToastProps = {
  description?: string;
  title: string;
};

export function TransactionToast({ description, title }: TransactionToastProps) {
  return (
    <div>
      <p className="font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm opacity-80">{description}</p>
      ) : null}
    </div>
  );
}
