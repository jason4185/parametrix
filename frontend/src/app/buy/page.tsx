import { AppShell } from "@/components/layout/AppShell";
import { BuyPolicyForm } from "@/components/policy/BuyPolicyForm";
import { buyPageContent } from "@/lib/content";

export default function BuyPage() {
  return (
    <AppShell
      eyebrow="Purchase"
      title="Buy Coverage"
      description={buyPageContent.description}
    >
      <BuyPolicyForm />
    </AppShell>
  );
}
