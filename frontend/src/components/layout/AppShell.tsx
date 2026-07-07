import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopNav } from "@/components/layout/TopNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageShell } from "@/components/ui/PageShell";

type AppShellProps = {
  children: React.ReactNode;
  description?: string;
  eyebrow: string;
  showBack?: boolean;
  showHome?: boolean;
  showPageHeader?: boolean;
  showWallet?: boolean;
  title: string;
};

export function AppShell({
  children,
  description,
  eyebrow,
  showBack = true,
  showHome = true,
  showPageHeader = true,
  showWallet = true,
  title,
}: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#071013] text-text">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
            sectionLabel={title}
            showBack={showBack}
            showHome={showHome}
            showWallet={showWallet}
          />
          <section className="flex-1 bg-[radial-gradient(circle_at_top_right,rgba(0,229,255,0.08),transparent_36rem)] px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <PageShell size="wide">
              {showPageHeader ? (
                <PageHeader
                  eyebrow={eyebrow}
                  subtitle={description}
                  title={title}
                />
              ) : null}
              {children}
            </PageShell>
          </section>
        </div>
      </div>
    </main>
  );
}
