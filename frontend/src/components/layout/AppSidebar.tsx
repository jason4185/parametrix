"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Settings2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { ParametrixLogo } from "@/components/brand/ParametrixLogo";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const links = [
  { href: "/dashboard", icon: ShieldCheck, label: "My Policies" },
  { href: "/buy", icon: WalletCards, label: "Buy Coverage" },
];

const adminLink = {
  href: "/admin",
  icon: Settings2,
  label: "Settlement Operations",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAdminAccess();
  const visibleLinks = isAdmin ? [...links, adminLink] : links;

  return (
    <aside className="hidden w-72 border-r border-white/10 bg-[#081316]/95 px-5 py-6 lg:block">
      <ParametrixLogo />
      <nav className="mt-10 space-y-2">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              className={[
                "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition duration-200 active:scale-[0.98]",
                isActive
                  ? "border-cyan/20 bg-cyan/10 text-white"
                  : "border-transparent text-muted hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
              href={link.href}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link
        className="mt-8 flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-muted transition duration-200 hover:border-cyan/35 hover:bg-white/[0.04] hover:text-text active:scale-[0.98]"
        href="/"
      >
        <Home className="h-4 w-4" />
        Home
      </Link>
    </aside>
  );
}
