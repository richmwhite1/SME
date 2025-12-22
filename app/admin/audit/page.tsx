import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AuditDashboardClient from "@/components/admin/AuditDashboardClient";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function AuditDashboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/");
  }
  const sql = getDb();

  // Check user's reputation and SME status
  const profiles = await sql`
    SELECT contributor_score, is_verified_expert
    FROM profiles
    WHERE id = ${user.id}
    LIMIT 1
  `;

  if (!profiles || profiles.length === 0) {
    redirect("/");
  }

  const profile = profiles[0];
  const contributorScore = (profile as { contributor_score?: number }).contributor_score || 0;
  const isCertifiedSME = (profile as { is_verified_expert?: boolean }).is_verified_expert || false;
  // Access control: reputation > 500 OR certified_sme
  if (contributorScore <= 500 && !isCertifiedSME) {
    redirect("/?toast=Higher+Trust+Weight+Required");
  }
  // Fetch pending evidence submissions
  let submissions = [];
  try {
    submissions = await sql`
      SELECT 
        es.id,
        es.product_id,
        es.lab_name,
        es.batch_number,
        es.document_url,
        es.document_type,
        es.status,
        es.created_at as submitted_at,
        p.id as product_id,
        p.title as protocol_title
      FROM evidence_submissions es
      LEFT JOIN protocols p ON es.product_id = p.id
      WHERE es.status = 'pending'
      ORDER BY es.created_at ASC
    `;
  } catch (error) {
    console.error("Error fetching evidence submissions:", error);
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
