import { createClient } from "@/lib/supabase/server";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AuditDashboardClient from "@/components/admin/AuditDashboardClient";

export const dynamic = "force-dynamic";

export default async function AuditDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const supabase = createClient();

  // Check user's reputation and SME status
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("contributor_score, is_verified_expert")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/");
  }

  const contributorScore = (profile as { contributor_score?: number }).contributor_score || 0;
  const isCertifiedSME = (profile as { is_verified_expert?: boolean }).is_verified_expert || false;

  // Access control: reputation > 500 OR certified_sme
  if (contributorScore <= 500 && !isCertifiedSME) {
    redirect("/?toast=Higher+Trust+Weight+Required");
  }

  // Fetch pending evidence submissions
  const { data: submissions, error: submissionsError } = await supabase
    .from("evidence_submissions")
    .select(`
      id,
      protocol_id,
      lab_name,
      batch_number,
      document_url,
      document_type,
      status,
      submitted_at,
      protocols:protocol_id (
        id,
        title
      )
    `)
    .eq("status", "pending_audit")
    .order("submitted_at", { ascending: true });

  if (submissionsError) {
    console.error("Error fetching evidence submissions:", submissionsError);
  }

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold text-bone-white">
            SME Audit Dashboard
          </h1>
          <p className="text-lg text-bone-white/70 font-mono">
            High-security terminal for Trusted Voices
          </p>
        </div>

        {/* Audit Queue */}
        <div className="border border-translucent-emerald bg-muted-moss">
          <div className="border-b border-translucent-emerald p-4">
            <h2 className="font-mono text-sm uppercase tracking-wider text-bone-white">
              Audit Queue
            </h2>
          </div>
          <AuditDashboardClient 
            submissions={(submissions || []) as any[]}
          />
        </div>
      </div>
    </main>
  );
}



