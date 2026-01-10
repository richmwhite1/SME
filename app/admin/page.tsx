import { isAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  getFlaggedContent,
  getModerationQueue,
  getBlacklistKeywords,
  getAllUsers,
} from "@/app/actions/admin-actions";
import {
  getContactSubmissions,
  getBrandApplications,
  getProductIntakeSubmissions,
} from "@/app/actions/intake-actions";
import UnifiedAdminClient from "@/components/admin/UnifiedAdminClient";
import { Shield, AlertTriangle, Package, TrendingUp, Users, Award } from "lucide-react";
export const dynamic = "force-dynamic";
export default async function UnifiedAdminPage() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect("/");
  }

  const sql = getDb();

  // Fetch all products with review counts
  let products = [];
  try {
    products = await sql`
      SELECT 
        id,
        title,
        slug,
        created_at,
        is_sme_certified,
        third_party_lab_verified,
        purity_tested,
        source_transparency,
        potency_verified,
        excipient_audit,
        operational_legitimacy,
        coa_url,
        admin_status,
        certification_tier,
        admin_notes,
        sme_signals,
        technical_specs,
        technical_docs_url as tech_docs,
        target_audience,
        core_value_proposition,
        sme_access_note,
        youtube_link as video_url,
        reference_url as citation_url,
        view_count,
        click_count
      FROM products
      ORDER BY created_at DESC
    `;
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  // Get review counts for each product
  const productsWithReviews = await Promise.all(
    (products || []).map(async (product) => {
      try {
        const reviewCount = await sql`
          SELECT COUNT(*) as count
          FROM reviews
          WHERE product_id = ${(product as any).id}
          AND (is_flagged = false OR is_flagged IS NULL)
        `;
        return {
          ...(product as any),
          review_count: reviewCount?.[0]?.count || 0,
        };
      } catch (err) {
        return {
          ...(product as any),
          review_count: 0,
        };
      }
    })
  );
  // Fetch flagged content
  let flaggedContent;
  try {
    flaggedContent = await getFlaggedContent();
  } catch (error) {
    console.error("Error fetching flagged content:", error);
    flaggedContent = {
      discussions: [],
      reviews: [],
      discussionComments: [],
      productComments: [],
      errors: {},
    };
  }
  // Fetch moderation queue
  let queueItems;
  try {
    queueItems = await getModerationQueue();
  } catch (error) {
    console.error("Error fetching moderation queue:", error);
    queueItems = [];
  }
  // Fetch blacklist keywords
  let keywords;
  try {
    keywords = await getBlacklistKeywords();
  } catch (error) {
    console.error("Error fetching blacklist keywords:", error);
    keywords = [];
  }
  // Fetch all users
  let allUsers;
  try {
    allUsers = await getAllUsers();
  } catch (error) {
    console.error("Error fetching users:", error);
    allUsers = [];
  }
  // Fetch intake pipeline data
  let contactSubmissions, brandApplications, productIntake;
  try {
    contactSubmissions = await getContactSubmissions();
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    contactSubmissions = [];
  }
  try {
    brandApplications = await getBrandApplications();
  } catch (error) {
    console.error("Error fetching brand applications:", error);
    brandApplications = [];
  }
  try {
    productIntake = await getProductIntakeSubmissions();
  } catch (error) {
    console.error("Error fetching product intake:", error);
    productIntake = [];
  }

  // Fetch SME certifications
  let smeCertifications;
  try {
    smeCertifications = await sql`
      SELECT 
        sc.id,
        sc.product_id,
        pr.title as product_title,
        pr.slug as product_slug,
        sc.brand_owner_id,
        p.full_name as brand_owner_name,
        sc.lab_report_urls,
        sc.purity_data_urls,
        sc.payment_status,
        sc.status,
        sc.created_at
      FROM sme_certifications sc
      JOIN products pr ON sc.product_id = pr.id
      JOIN profiles p ON sc.brand_owner_id = p.id
      WHERE sc.status IN ('pending', 'under_review', 'more_info_needed')
      AND sc.payment_status = 'paid'
      ORDER BY sc.created_at ASC
    `;
  } catch (error) {
    console.error("Error fetching SME certifications:", error);
    smeCertifications = [];
  }

  // Calculate stats
  const totalProducts = productsWithReviews.length;
  const certifiedProducts = productsWithReviews.filter((p: any) => (p as any).is_sme_certified).length;
  const pendingProducts = totalProducts - certifiedProducts;
  const totalFlagged =
    (flaggedContent.discussions?.length || 0) +
    (flaggedContent.reviews?.length || 0) +
    (flaggedContent.discussionComments?.length || 0) +
    (flaggedContent.productComments?.length || 0);
  return (
    <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 border-b border-bone-white/20 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-emerald-400" />
            <h1 className="font-mono text-3xl font-bold text-bone-white sm:text-4xl">
              UNIFIED ADMIN PORTAL
            </h1>
          </div>
          <p className="font-mono text-sm text-bone-white/70 sm:text-base">
            Laboratory management and moderation control center
          </p>
        </div>
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-5 w-5 text-bone-white/70" />
              <p className="text-xs text-bone-white/70 uppercase tracking-wider">Total Products</p>
            </div>
            <p className="text-2xl font-bold text-bone-white">{totalProducts}</p>
          </div>
          <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <Award className="h-5 w-5 text-emerald-400" />
              <p className="text-xs text-bone-white/70 uppercase tracking-wider">Certified</p>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{certifiedProducts}</p>
          </div>
          <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-5 w-5 text-bone-white/70" />
              <p className="text-xs text-bone-white/70 uppercase tracking-wider">Pending</p>
            </div>
            <p className="text-2xl font-bold text-bone-white">{pendingProducts}</p>
          </div>
          <div className="border border-bone-white/20 bg-bone-white/5 p-4 font-mono">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-xs text-bone-white/70 uppercase tracking-wider">Flagged</p>
            </div>
            <p className="text-2xl font-bold text-red-500">{totalFlagged}</p>
          </div>
        </div>
        {/* Tabbed Interface */}
        <UnifiedAdminClient
          products={productsWithReviews}
          flaggedContent={flaggedContent}
          queueItems={queueItems}
          keywords={keywords}
          users={allUsers}
          contactSubmissions={contactSubmissions}
          brandApplications={brandApplications}
          productIntake={productIntake}
          smeCertifications={smeCertifications}
        />
      </div>
    </main>
  );
}
