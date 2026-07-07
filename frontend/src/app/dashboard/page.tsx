import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { AppShell } from "@/components/layout/AppShell";
import { dashboardContent } from "@/lib/content";

export default function DashboardPage() {
  return (
    <AppShell
      description={dashboardContent.description}
      eyebrow="Coverage"
      title="My Policies"
    >
      <DashboardContent />
    </AppShell>
  );
}
