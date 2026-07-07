import { AppHomeContent } from "@/components/app/AppHomeContent";
import { AppShell } from "@/components/layout/AppShell";

export default function AppEntryPage() {
  return (
    <AppShell
      eyebrow="Home"
      showBack={false}
      title="Home"
      description="Start coverage, review your policies, and track payout availability."
    >
      <AppHomeContent />
    </AppShell>
  );
}
