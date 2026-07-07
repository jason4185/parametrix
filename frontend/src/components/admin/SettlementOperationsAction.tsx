"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { AnimatedCard } from "@/components/ui/AnimatedCard";

export function SettlementOperationsAction({ delay = 0 }: { delay?: number }) {
  return (
    <Link href="/admin">
      <AnimatedCard className="h-full p-6" delay={delay}>
        <Activity className="h-5 w-5 text-cyan" />
        <h2 className="mt-4 text-xl font-semibold text-text">
          Settlement Operations
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Review active coverage, pool status, and settlement actions.
        </p>
      </AnimatedCard>
    </Link>
  );
}
