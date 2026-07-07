"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

type PageActionsProps = {
  showBack?: boolean;
  showHome?: boolean;
  showWallet?: boolean;
};

export function PageActions({
  showBack = true,
  showHome = true,
  showWallet = true,
}: PageActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-end gap-3 max-sm:flex-wrap">
      {showBack ? (
        <button
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan/35 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      ) : null}
      {showHome ? (
        <Link
          className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan/35 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]"
          href="/"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      ) : null}
      {showWallet ? <WalletConnectButton /> : null}
    </div>
  );
}
