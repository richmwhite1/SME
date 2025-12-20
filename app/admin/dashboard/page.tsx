import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/client";
import { getFlaggedContent } from "@/app/actions/admin-actions";
import { Package, Shield, TrendingUp, AlertTriangle } from "lucide-react";
import SeedMasterTopicsButton from "@/components/admin/SeedMasterTopicsButton";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect("/");
  }

  // Redirect to unified admin portal
  redirect("/admin");

  const supabase = createClient();

  // Fetch all products with review counts
  const { data: products, error: productsError } = await supabase
    .from("protocols")
    .select(
      `
      id,
      title,
      slug,
      created_at,
      is_sme_certified,
      invite_sent,
      certification_notes,
      third_party_lab_verified,
      purity_tested,
      source_transparency,
      potency_verified,
      excipient_audit,
      operational_legitimacy,
      coa_url
    `
    )
    .order("created_at", { ascending: false });

  // Get review counts for each product
  const productsWithReviews = await Promise.all(
    (products || []).map(async (product) => {
      const { count } = await supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("protocol_id", (product as any).id)
        .or("is_flagged.eq.false,is_flagged.is.null");

      return {
        ...(product as any),
        review_count: count || 0,
      };
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
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold text-bone-white">Admin Command Center</h1>
          <p className="text-lg text-bone-white/70 font-mono">
            Manage products, certifications, and monitor community signals
          </p>
        </div>

        {/* Content Seeding Tool */}
        <div className="mb-8 border border-translucent-emerald bg-muted-moss p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="mb-2 font-serif text-xl font-semibold text-bone-white">Content Seeding</h2>
              <p className="text-sm text-bone-white/70 font-mono">
                Seed introductory discussions for all 12 Master Topics to launch the community hubs.
              </p>
            </div>
            <SeedMasterTopicsButton />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="border border-translucent-emerald bg-muted-moss p-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-heart-green" />
              <div>
                <p className="text-sm text-bone-white/70 font-mono">Total Products</p>
                <p className="text-2xl font-bold text-bone-white font-mono">{totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="border border-translucent-emerald bg-muted-moss p-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-sme-gold" />
              <div>
                <p className="text-sm text-bone-white/70 font-mono">Certified</p>
                <p className="text-2xl font-bold text-bone-white font-mono">{certifiedProducts}</p>
              </div>
            </div>
          </div>
          <div className="border border-translucent-emerald bg-muted-moss p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-third-eye-indigo" />
              <div>
                <p className="text-sm text-bone-white/70 font-mono">Pending</p>
                <p className="text-2xl font-bold text-bone-white font-mono">{pendingProducts}</p>
              </div>
            </div>
          </div>
          <div className="border border-translucent-emerald bg-muted-moss p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-heart-green" />
              <div>
                <p className="text-sm text-bone-white/70 font-mono">Flagged Content</p>
                <p className="text-2xl font-bold text-bone-white font-mono">{totalFlagged}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Product Inventory Table */}
          <div className="lg:col-span-2">
            <AdminDashboardClient
              products={productsWithReviews}
              flaggedContent={flaggedContent}
            />
          </div>

          {/* Signal Monitoring Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 border border-translucent-emerald bg-muted-moss p-6">
              <h2 className="mb-4 flex items-center gap-2 font-serif text-xl font-semibold text-bone-white">
                <AlertTriangle className="h-5 w-5 text-heart-green" />
                Recently Flagged Content
              </h2>
              <div className="space-y-4">
                {totalFlagged === 0 ? (
                  <p className="text-sm text-bone-white/70 font-mono">No flagged content</p>
                ) : (
                  <>
                    {flaggedContent.discussions && flaggedContent.discussions.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-bone-white font-mono">
                          Discussions ({flaggedContent.discussions.length})
                        </h3>
                        <div className="space-y-2">
                          {flaggedContent.discussions.slice(0, 3).map((discussion: any) => (
                            <a
                              key={discussion.id}
                              href={`/discussions/${discussion.slug}`}
                              className="block border border-heart-green/30 bg-heart-green/10 p-3 text-sm hover:bg-heart-green/20 transition-colors"
                            >
                              <p className="font-medium text-bone-white font-mono">
                                {discussion.title}
                              </p>
                              <p className="text-xs text-bone-white/70 font-mono">
                                {discussion.flag_count} flag{discussion.flag_count !== 1 ? "s" : ""}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {flaggedContent.reviews && flaggedContent.reviews.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-bone-white font-mono">
                          Reviews ({flaggedContent.reviews.length})
                        </h3>
                        <div className="space-y-2">
                          {flaggedContent.reviews.slice(0, 3).map((review: any) => (
                            <a
                              key={review.id}
                              href={`/products/${review.protocols?.slug}`}
                              className="block border border-heart-green/30 bg-heart-green/10 p-3 text-sm hover:bg-heart-green/20 transition-colors"
                            >
                              <p className="font-medium text-bone-white font-mono">
                                Review on {review.protocols?.title || "Product"}
                              </p>
                              <p className="text-xs text-bone-white/70 font-mono">
                                {review.flag_count} flag{review.flag_count !== 1 ? "s" : ""}
                              </p>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {flaggedContent.discussionComments &&
                      flaggedContent.discussionComments.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-medium text-bone-white font-mono">
                            Comments ({flaggedContent.discussionComments.length})
                          </h3>
                          <div className="space-y-2">
                            {flaggedContent.discussionComments.slice(0, 3).map((comment: any) => (
                              <a
                                key={comment.id}
                                href={`/discussions/${comment.discussions?.slug}`}
                                className="block border border-heart-green/30 bg-heart-green/10 p-3 text-sm hover:bg-heart-green/20 transition-colors"
                              >
                                <p className="font-medium text-bone-white font-mono">
                                  Comment on {comment.discussions?.title || "Discussion"}
                                </p>
                                <p className="text-xs text-bone-white/70 font-mono">
                                  {comment.flag_count} flag{comment.flag_count !== 1 ? "s" : ""}
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    {flaggedContent.productComments &&
                      flaggedContent.productComments.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm font-medium text-bone-white font-mono">
                            Product Comments ({flaggedContent.productComments.length})
                          </h3>
                          <div className="space-y-2">
                            {flaggedContent.productComments.slice(0, 3).map((comment: any) => (
                              <a
                                key={comment.id}
                                href={`/products/${comment.protocols?.slug}`}
                                className="block border border-heart-green/30 bg-heart-green/10 p-3 text-sm hover:bg-heart-green/20 transition-colors"
                              >
                                <p className="font-medium text-bone-white font-mono">
                                  Comment on {comment.protocols?.title || "Product"}
                                </p>
                                <p className="text-xs text-bone-white/70 font-mono">
                                  {comment.flag_count} flag{comment.flag_count !== 1 ? "s" : ""}
                                </p>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

