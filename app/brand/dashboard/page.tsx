import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import { Package, Award, TrendingUp } from "lucide-react";
import SMECertificationModal from "@/components/brand/SMECertificationModal";
import SubscriptionStatusBanner from "@/components/brand/SubscriptionStatusBanner";
import BillingTransparencyCard from "@/components/brand/BillingTransparencyCard";
import BrandDashboardClient from "@/components/brand/BrandDashboardClient";

const sql = neon(process.env.DATABASE_URL!);

export const dynamic = "force-dynamic";

export default async function BrandDashboard() {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    // Check if user is a brand rep
    const userProfile = await sql`
    SELECT role, full_name, email FROM profiles WHERE id = ${userId}
  `;

    if (userProfile.length === 0 || userProfile[0].role !== 'BRAND_REP') {
        redirect("/");
    }

    // Fetch brand's products with buy_url
    const products = await sql`
    SELECT 
      id,
      title,
      slug,
      is_verified,
      is_sme_certified,
      discount_code,
      buy_url,
      visit_count,
      created_at
    FROM products
    WHERE brand_owner_id = ${userId}
    ORDER BY created_at DESC
  `;

    // Fetch brand verification status
    const brandVerification = await sql`
    SELECT 
      subscription_status,
      created_at
    FROM brand_verifications
    WHERE user_id = ${userId}
    AND status = 'approved'
    ORDER BY created_at DESC
    LIMIT 1
  `;

    // Fetch SME certifications
    const certifications = await sql`
    SELECT 
      sc.id,
      sc.product_id,
      sc.status,
      sc.payment_status,
      sc.reviewer_notes,
      sc.rejection_reason,
      sc.created_at,
      p.title as product_title,
      p.slug as product_slug
    FROM sme_certifications sc
    JOIN products p ON sc.product_id = p.id
    WHERE sc.brand_owner_id = ${userId}
    ORDER BY sc.created_at DESC
  `;

    const subscriptionStatus = brandVerification[0]?.subscription_status || 'unknown';
    const totalViews = products.reduce((sum: number, p: any) => sum + (p.visit_count || 0), 0);
    const certifiedProducts = products.filter((p: any) => p.is_sme_certified).length;

    // Calculate this month's visits
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyVisits = await sql`
        SELECT COALESCE(SUM(visit_count), 0) as total
        FROM product_view_metrics
        WHERE brand_owner_id = ${userId}
        AND view_date >= ${firstDayOfMonth.toISOString().split('T')[0]}
    `;
    const totalVisitsThisMonth = Number(monthlyVisits[0]?.total || 0);

    const isSubscriptionActive = subscriptionStatus === 'active';

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-[#333] pb-6">
                    <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
                        Brand Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Manage your verified products and certifications
                    </p>
                </div>

                {/* Subscription Status Banner */}
                <SubscriptionStatusBanner subscriptionStatus={subscriptionStatus} />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="border border-[#333] bg-[#111] p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Package className="w-5 h-5 text-gray-500" />
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Total Products</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{products.length}</p>
                    </div>

                    <div className="border border-[#333] bg-[#111] p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Award className="w-5 h-5 text-emerald-500" />
                            <p className="text-xs text-gray-600 uppercase tracking-wider">SME Certified</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">{certifiedProducts}</p>
                    </div>

                    <div className="border border-[#333] bg-[#111] p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Total Views</p>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
                    </div>

                    <div className="border border-[#333] bg-[#111] p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                            <p className="text-xs text-gray-600 uppercase tracking-wider">Visits This Month</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-400">{totalVisitsThisMonth.toLocaleString()}</p>
                    </div>
                </div>

                {/* Billing Transparency Card */}
                <BillingTransparencyCard />

                {/* Products Section */}
                <BrandDashboardClient
                    products={products}
                    isSubscriptionActive={isSubscriptionActive}
                />

                {/* Certifications Section */}
                {certifications.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-white uppercase">SME Certification Applications</h2>

                        <div className="space-y-4">
                            {certifications.map((cert: any) => (
                                <div
                                    key={cert.id}
                                    className="border border-[#333] bg-[#111] p-6 rounded-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white mb-2">
                                                {cert.product_title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Status: </span>
                                                    <span className={`font-semibold uppercase ${cert.status === 'approved' ? 'text-emerald-400' :
                                                        cert.status === 'rejected' ? 'text-red-400' :
                                                            cert.status === 'under_review' ? 'text-blue-400' :
                                                                cert.status === 'more_info_needed' ? 'text-yellow-400' :
                                                                    'text-gray-400'
                                                        }`}>
                                                        {cert.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Payment: </span>
                                                    <span className={`font-semibold uppercase ${cert.payment_status === 'paid' ? 'text-emerald-400' : 'text-gray-400'
                                                        }`}>
                                                        {cert.payment_status}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Submitted: </span>
                                                    <span className="text-white">
                                                        {new Date(cert.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {cert.reviewer_notes && (
                                                <div className="mt-4 p-3 bg-blue-900/10 border border-blue-500/30 rounded">
                                                    <p className="text-xs text-blue-400 uppercase mb-1">Reviewer Notes</p>
                                                    <p className="text-sm text-white">{cert.reviewer_notes}</p>
                                                </div>
                                            )}

                                            {cert.rejection_reason && (
                                                <div className="mt-4 p-3 bg-red-900/10 border border-red-500/30 rounded">
                                                    <p className="text-xs text-red-400 uppercase mb-1">Rejection Reason</p>
                                                    <p className="text-sm text-white">{cert.rejection_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
