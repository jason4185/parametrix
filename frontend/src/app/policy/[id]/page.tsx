import { AppShell } from "@/components/layout/AppShell";
import { PolicyDetailClient } from "@/components/policy/PolicyDetailClient";
import { policyDetailsContent } from "@/lib/content";

type PolicyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { id } = await params;

  return (
    <AppShell
      eyebrow="COVERAGE DETAILS"
      title="Policy Details"
      description={policyDetailsContent.description}
      showPageHeader={false}
    >
      <PolicyDetailClient policyId={id} />
    </AppShell>
  );
}
