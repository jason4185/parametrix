import { ParametrixLogo } from "@/components/brand/ParametrixLogo";
import { PageActions } from "@/components/layout/PageActions";

type TopNavProps = {
  sectionLabel?: string;
  showBack?: boolean;
  showHome?: boolean;
  showWallet?: boolean;
};

export function TopNav({
  sectionLabel,
  showBack,
  showHome,
  showWallet,
}: TopNavProps) {
  return (
    <header className="border-b border-white/10 bg-[#071013]/90 px-5 py-4 backdrop-blur sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <ParametrixLogo size="sm" showWordmark />
          </div>
          {sectionLabel ? (
            <span className="hidden truncate text-sm font-medium text-muted sm:block">
              {sectionLabel}
            </span>
          ) : null}
        </div>
        <PageActions
          showBack={showBack}
          showHome={showHome}
          showWallet={showWallet}
        />
      </div>
    </header>
  );
}
