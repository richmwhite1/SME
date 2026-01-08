import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import BrandClaimWizard from "@/components/products/BrandClaimWizard";

export const dynamic = "force-dynamic";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function BrandClaimPage({ params }: PageProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/sign-in");
    }

    const { id: productId } = await params;
    const sql = getDb();

    // Fetch product details
    const product = await sql`
    SELECT 
      id,
      title,
      slug,
      is_verified,
      brand_owner_id
    FROM products
    WHERE id = ${productId}
  `;

    if (!product || product.length === 0) {
        redirect("/products");
    }

    const productData = product[0];

    // Check if product is already verified
    if (productData.is_verified) {
        redirect(`/products/${productData.slug}`);
    }

    // Check if user already has a pending or approved verification for this product
    const existingVerification = await sql`
    SELECT id, status, subscription_status
    FROM brand_verifications
    WHERE product_id = ${productId}
    AND user_id = ${userId}
    AND status IN ('pending', 'approved')
  `;

    if (existingVerification && existingVerification.length > 0) {
        const verification = existingVerification[0];

        // If already approved, redirect to product page
        if (verification.status === 'approved') {
            redirect(`/products/${productData.slug}`);
        }

        // If pending, show status message
        return (
            <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl">
                    <div className="border border-sme-gold/30 bg-sme-gold/5 p-8 rounded-lg text-center">
                        <h1 className="font-mono text-2xl font-bold text-bone-white mb-4">
                            Verification Pending
                        </h1>
                        <p className="text-bone-white/70 mb-2">
                            You have already submitted a verification request for <strong>{productData.title}</strong>.
                        </p>
                        <p className="text-bone-white/70 mb-6">
                            Subscription Status: <span className="text-sme-gold font-semibold">{verification.subscription_status || 'Pending Payment'}</span>
                        </p>
                        <p className="text-sm text-bone-white/50">
                            Our team will review your application and contact you via email.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    // Get user profile for pre-filling email
    const userProfile = await sql`
    SELECT email, full_name
    FROM profiles
    WHERE id = ${userId}
  `;

    const userEmail = userProfile?.[0]?.email || "";

    return (
        <main className="min-h-screen bg-forest-obsidian px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="font-mono text-3xl font-bold text-bone-white sm:text-4xl mb-4">
                        Claim Your Brand
                    </h1>
                    <p className="text-lg text-bone-white/70 font-mono">
                        Verify ownership of <span className="text-sme-gold">{productData.title}</span>
                    </p>
                </div>

                {/* Info Box */}
                <div className="mb-8 border border-bone-white/20 bg-bone-white/5 p-6 rounded-lg font-mono">
                    <h2 className="text-lg font-bold text-bone-white mb-3">What You'll Get:</h2>
                    <ul className="space-y-2 text-sm text-bone-white/70">
                        <li className="flex items-start gap-2">
                            <span className="text-sme-gold">✓</span>
                            <span>Official Brand Badge on your product page</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sme-gold">✓</span>
                            <span>Ability to respond to reviews and comments</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sme-gold">✓</span>
                            <span>Add "Buy Now" links and promo codes</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-sme-gold">✓</span>
                            <span>Manage official product benefits</span>
                        </li>
                    </ul>
                    <div className="mt-4 pt-4 border-t border-bone-white/10">
                        <p className="text-sm text-bone-white/70">
                            <strong className="text-bone-white">Pricing:</strong> $100/month or $0.01 per product page visit
                        </p>
                    </div>
                </div>

                {/* Wizard Component */}
                <BrandClaimWizard
                    productId={productId}
                    productTitle={productData.title}
                    productSlug={productData.slug}
                    userEmail={userEmail}
                />
            </div>
        </main>
    );
}
