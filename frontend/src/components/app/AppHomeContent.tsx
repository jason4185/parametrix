"use client";

import Link from "next/link";
import { ShieldCheck, WalletCards } from "lucide-react";
import { useAccount } from "wagmi";
import { SettlementOperationsAction } from "@/components/admin/SettlementOperationsAction";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useMyPolicyIds } from "@/hooks/useParametrixReads";

const quickActions = [
  {
    body: "Select a supported location, event level, policy type, and coverage duration.",
    href: "/buy",
    icon: WalletCards,
    title: "Buy Coverage",
  },
  {
    body: "Review your policies, settlement status, and eligible payouts.",
    href: "/dashboard",
    icon: ShieldCheck,
    title: "View My Policies",
  },
];

export function AppHomeContent() {
  const { isConnected } = useAccount();
  const { isAdmin } = useAdminAccess();
  const policyIds = useMyPolicyIds();

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <SectionCard className="p-7">
          <h2 className="text-2xl font-semibold text-text">
            Weather coverage, clearly priced.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Choose a supported location, event level, and coverage period.
            Policy terms are verified before purchase and settlement checks
            compare official weather data against your selected threshold.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/buy">Buy Coverage</Button>
            <Button href="/dashboard" variant="secondary">
              View My Policies
            </Button>
          </div>
        </SectionCard>

        <MetricCard
          icon={ShieldCheck}
          label="Policy count"
          meta={isConnected ? "Saved coverage" : "Connect wallet to load"}
          value={
            isConnected
              ? policyIds.isLoading
                ? "..."
                : policyIds.data?.length ?? 0
              : "--"
          }
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map(({ body, href, icon: Icon, title }, index) => (
          <Link href={href} key={title}>
            <AnimatedCard className="h-full p-6" delay={index * 0.04}>
              <Icon className="h-5 w-5 text-cyan" />
              <h2 className="mt-4 text-xl font-semibold text-text">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{body}</p>
            </AnimatedCard>
          </Link>
        ))}
        {isAdmin ? (
          <SettlementOperationsAction delay={quickActions.length * 0.04} />
        ) : null}
      </div>
    </div>
  );
}
