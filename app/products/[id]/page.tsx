import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowDown, Clock, Check, ExternalLink, FileText } from "lucide-react";
import ProductCard from "@/components/holistic/ProductCard";
import ReviewSection from "@/components/holistic/ReviewSection";
import ProductComments from "@/components/products/ProductComments";
import SubmitEvidenceButton from "@/components/products/SubmitEvidenceButton";
import ProductImageGallery from "@/components/products/ProductImageGallery";
import CitationButton from "@/components/ui/CitationButton";
import ShareToX from "@/components/social/ShareToX";
import SMECertifiedBadge from "@/components/admin/SMECertifiedBadge";
import TransparencyCard from "@/components/TransparencyCard";
import Button from "@/components/ui/Button";
import CompareButton from "@/components/products/CompareButton";
import ReactMarkdown from "react-markdown";
import SearchBar from "@/components/search/SearchBar";
import { getDb } from "@/lib/db";

// Force dynamic rendering to bypass caching issues
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Generate dynamic metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sql = getDb();

  try {
    const result = await sql`
      SELECT title, ai_summary, is_sme_certified, images
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    const product = result[0];

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    // Prefix title with certified badge if SME certified
    const titlePrefix = product.is_sme_certified ? "✅ Certified: " : "";
    const title = `${titlePrefix}${product.title}`;

    // Use first 160 characters of ai_summary as description
    const description = product.ai_summary
      ? product.ai_summary.substring(0, 160).replace(/\n/g, " ").trim()
      : `Transparency report for ${product.title}. Research-based analysis and verification.`;

    // Get first image for Open Graph
    let imageUrl: string | undefined;
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      imageUrl = product.images[0];
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
    const canonicalUrl = `${baseUrl}/products/${id}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: "article",
        ...(imageUrl && { images: [imageUrl] }),
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        ...(imageUrl && { images: [imageUrl] }),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Product",
      description: "Product transparency report and research analysis.",
    };
  }
}

interface ProductItem {
  step_order: number;
  usage_instructions: string;
  products: {
    name: string;
    brand: string;
  } | null;
}

interface Product {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
  reference_url?: string | null;
  ai_summary?: string | null;
  buy_url?: string | null;
  discount_code?: string | null;
  lab_tested?: boolean;
  organic?: boolean;
  purity_verified?: boolean;
  third_party_coa?: boolean;
  certification_notes?: string | null;
  lab_pdf_url?: string | null;
  is_sme_certified?: boolean;
  third_party_lab_verified?: boolean;
  purity_tested?: boolean;
  source_transparency?: boolean;
  potency_verified?: boolean;
  excipient_audit?: boolean;
  operational_legitimacy?: boolean;
  coa_url?: string | null;
  images?: string[] | null;
  product_items: ProductItem[];
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+ requirement)
  const { id } = await params;
  const sql = getDb();

  console.log("Product Detail Page - Fetching product with ID:", id);
  try {
    // Fetch product details
    const productResult = await sql`
      SELECT *
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    const product = productResult[0];

    if (!product) {
      console.error("Product not found for ID:", id);
      notFound();
    }

    // Fetch product items (steps)
    // Legacy support: table might be named protocol_items or product_items
    // Since we renamed tables in migration but might have missed protocol_items, we use protocol_items mostly.
    // However, if we assume protocol_items IS the table name:
    let productItems: ProductItem[] = [];
    try {
      const itemsResult = await sql`
        SELECT 
          pi.step_order, 
          pi.usage_instructions,
          p.name as product_name,
          p.brand as product_brand
        FROM protocol_items pi
        LEFT JOIN products p ON pi.product_id = p.id
        WHERE pi.protocol_id = ${id}
        ORDER BY pi.step_order ASC
      `;

      productItems = itemsResult.map((item: any) => ({
        step_order: item.step_order,
        usage_instructions: item.usage_instructions,
        products: item.product_name ? {
          name: item.product_name,
          brand: item.product_brand
        } : null
      }));
    } catch (err) {
      // console.warn("Error fetching product items:", err);
      // Fallback if table doesn't exist or error
    }

    // Construct full product object
    const typedProduct: Product = {
      ...(product as any),
      product_items: productItems
    };

    // Handle images
    let imagesArray: string[] = [];
    if (typedProduct.images) {
      if (Array.isArray(typedProduct.images)) {
        imagesArray = typedProduct.images.filter((img): img is string => typeof img === 'string' && img.length > 0);
      } else if (typeof typedProduct.images === 'string') {
        const imagesString: string = typedProduct.images;
        const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
        if (arrayMatch) {
          imagesArray = arrayMatch[1]
            .split(',')
            .map((s: string) => s.trim().replace(/^"|"$/g, ''))
            .filter((img: string): img is string => img.length > 0);
        }
      }
    }

    const safeImages = imagesArray.filter(img =>
      !!img && (img.startsWith('http://') || img.startsWith('https://'))
    );

    // Fetch comments
    let serializedComments: any[] = [];
    try {
      // Use product_comments table
      const commentsResult = await sql`
        SELECT 
          pc.id, pc.content, pc.created_at, pc.parent_id,
          p.id as author_id, p.full_name, p.username, p.avatar_url, p.badge_type, p.contributor_score, p.archive_clerk_id
        FROM product_comments pc
        LEFT JOIN profiles p ON pc.author_id = p.id
        WHERE pc.protocol_id = ${id}
          AND (pc.is_flagged IS FALSE OR pc.is_flagged IS NULL)
        ORDER BY pc.created_at ASC
      `;

      serializedComments = commentsResult.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at instanceof Date ? comment.created_at.toISOString() : comment.created_at,
        parent_id: comment.parent_id,
        profiles: comment.author_id ? {
          id: String(comment.author_id),
          full_name: comment.full_name,
          username: comment.username,
          avatar_url: comment.avatar_url,
          badge_type: comment.badge_type,
          contributor_score: comment.contributor_score,
          archive_clerk_id: comment.archive_clerk_id || comment.author_id
        } : null
      }));
    } catch (commentsErr) {
      console.error("Error fetching comments:", commentsErr);
    }

    // Check if product is SME certified
    const isSMECertified = typedProduct.is_sme_certified === true;

    // Build base URL for canonical and structured data
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
    const canonicalUrl = `${baseUrl}/products/${id}`;

    // Build JSON-LD structured data for SEO
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: typedProduct.title,
      description: typedProduct.ai_summary
        ? typedProduct.ai_summary.substring(0, 200).replace(/\n/g, " ").trim()
        : typedProduct.problem_solved,
      image: safeImages.length > 0 ? safeImages : undefined,
      ...(typedProduct.buy_url && {
        offers: {
          "@type": "Offer",
          url: typedProduct.buy_url,
          availability: "https://schema.org/InStock",
        },
      }),
      ...(isSMECertified && {
        additionalProperty: [
          {
            "@type": "PropertyValue",
            name: "SME Certified",
            value: "true",
          },
          ...(typedProduct.source_transparency ? [{
            "@type": "PropertyValue",
            name: "Source Transparency",
            value: "Verified",
          }] : []),
          ...(typedProduct.purity_tested ? [{
            "@type": "PropertyValue",
            name: "Purity Tested",
            value: "Verified",
          }] : []),
          ...(typedProduct.potency_verified ? [{
            "@type": "PropertyValue",
            name: "Potency Verified",
            value: "Verified",
          }] : []),
          ...(typedProduct.excipient_audit ? [{
            "@type": "PropertyValue",
            name: "Excipient Audit",
            value: "Verified",
          }] : []),
          ...(typedProduct.operational_legitimacy ? [{
            "@type": "PropertyValue",
            name: "Operational Legitimacy",
            value: "Verified",
          }] : []),
        ],
      }),
      // Add FactCheck schema for research-based analysis
      ...(typedProduct.ai_summary && {
        mainEntity: {
          "@type": "Article",
          headline: `${typedProduct.title} - Transparency Report`,
          description: typedProduct.ai_summary.substring(0, 200).replace(/\n/g, " ").trim(),
          author: {
            "@type": "Organization",
            name: "SME Research Team",
          },
          ...(typedProduct.reference_url && {
            citation: typedProduct.reference_url,
          }),
        },
      }),
    };

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        <main className="min-h-screen bg-forest-obsidian">
          <div className="mx-auto max-w-7xl px-6 py-8">
            {/* Global Search Bar - Most Prominent Tool */}
            <div className="mb-8">
              <div className="max-w-3xl mx-auto">
                <label className="mb-2 block text-xs font-mono uppercase tracking-wider text-bone-white/70">
                  Technical Audit Search
                </label>
                <SearchBar />
                <p className="mt-2 text-xs text-bone-white/50 font-mono text-center">
                  Search by &quot;Job to be Done&quot; (e.g., &quot;Fix my sleep&quot;) or ingredient audit
                </p>
              </div>
            </div>

            {/* Back to Products Button */}
            <div className="mb-6">
              <Link href="/products">
                <button className="inline-flex items-center gap-2 text-sm text-bone-white/70 hover:text-bone-white font-mono transition-colors">
                  <ArrowLeft size={14} />
                  Back to Products
                </button>
              </Link>
            </div>

            {/* Two-Column Grid Layout - 60/40 Split (Spec Sheet Layout) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 lg:gap-8 mb-12">
              {/* Left Column: Visuals (60% - 3/5 columns) */}
              <div className="lg:col-span-3">
                {safeImages.length > 0 ? (
                  <ProductImageGallery images={safeImages} />
                ) : (
                  <div className="aspect-square border border-translucent-emerald bg-forest-obsidian flex items-center justify-center">
                    <p className="text-bone-white/50 text-sm font-mono">
                      No images available
                    </p>
                  </div>
                )}
              </div>

              {/* Right Column: High-Density Data Stack (40% - 2/5 columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header - Serif Product Name */}
                <div>
                  <h1 className="mb-3 font-serif text-3xl font-bold text-bone-white leading-tight">
                    {typedProduct.title}
                  </h1>
                  <p className="text-base text-bone-white/80 leading-relaxed">
                    {typedProduct.problem_solved}
                  </p>
                </div>

                {/* SME Certified Badge */}
                {isSMECertified && (
                  <div>
                    <SMECertifiedBadge
                      thirdPartyLabVerified={typedProduct.third_party_lab_verified || false}
                      purityTested={typedProduct.purity_tested || false}
                      sourceTransparency={typedProduct.source_transparency || false}
                      potencyVerified={typedProduct.potency_verified || false}
                      excipientAudit={typedProduct.excipient_audit || false}
                      operationalLegitimacy={typedProduct.operational_legitimacy || false}
                    />
                  </div>
                )}

                {/* 5-Pillar Transparency Checklist - High-Density Data Stack */}
                {isSMECertified && (
                  <TransparencyCard
                    sourceTransparency={typedProduct.source_transparency || false}
                    purityTested={typedProduct.purity_tested || false}
                    potencyVerified={typedProduct.potency_verified || false}
                    excipientAudit={typedProduct.excipient_audit || false}
                    operationalLegitimacy={typedProduct.operational_legitimacy || false}
                    thirdPartyLabVerified={typedProduct.third_party_lab_verified || false}
                    certificationNotes={typedProduct.certification_notes}
                  />
                )}

                {/* Purchase Button - SME Gold */}
                {typedProduct.buy_url && (
                  <a
                    href={typedProduct.buy_url.includes("?") ? `${typedProduct.buy_url}&ref=SME` : `${typedProduct.buy_url}?ref=SME`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <button className="w-full border border-sme-gold bg-sme-gold px-6 py-3 text-sm font-semibold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] transition-colors font-mono uppercase tracking-wider">
                      <span className="flex items-center justify-center gap-2">
                        <ExternalLink size={16} />
                        Purchase
                      </span>
                    </button>
                  </a>
                )}

                {/* Reference Links - Technical */}
                <div className="flex flex-wrap gap-2">
                  <CompareButton productId={typedProduct.id} productTitle={typedProduct.title} />
                  {typedProduct.reference_url && (
                    <CitationButton url={typedProduct.reference_url} />
                  )}
                  {typedProduct.coa_url && (
                    <a
                      href={typedProduct.coa_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-translucent-emerald bg-muted-moss px-3 py-1.5 text-xs text-bone-white hover:bg-forest-obsidian hover:border-heart-green transition-colors font-mono uppercase"
                    >
                      <FileText size={12} />
                      COA
                    </a>
                  )}
                  <ShareToX
                    title={typedProduct.title}
                    url={`/products/${typedProduct.id}`}
                    type="product"
                  />
                </div>
              </div>
            </div>

            {/* AI Summary / Expert Notebook - Full Width Below Grid */}
            {typedProduct.ai_summary && (
              <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8">
                <h2 className="mb-6 font-serif text-2xl font-bold text-bone-white">Expert Notebook</h2>
                <div className="prose prose-slate max-w-none 
                  prose-headings:font-serif prose-headings:text-bone-white prose-headings:font-bold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-bone-white/80 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-[15px]
                  prose-strong:text-bone-white prose-strong:font-semibold
                  prose-ul:text-bone-white/80 prose-ul:leading-relaxed
                  prose-ol:text-bone-white/80 prose-ol:leading-relaxed
                  prose-li:text-bone-white/80 prose-li:my-2
                  prose-a:text-heart-green prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-heart-green
                  prose-code:font-mono prose-code:text-bone-white prose-code:bg-forest-obsidian prose-code:border prose-code:border-translucent-emerald prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
                  prose-blockquote:border-l-2 prose-blockquote:border-l-translucent-emerald prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-bone-white/70">
                  <ReactMarkdown>{typedProduct.ai_summary}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Timeline Steps - Clinical Layout */}
            {typedProduct.product_items && typedProduct.product_items.length > 0 && (
              <div className="mb-12 space-y-6">
                <h2 className="font-serif text-xl font-bold text-bone-white mb-6">Product Steps</h2>
                {typedProduct.product_items.map((item, index) => (
                  <div key={item.step_order} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-shrink-0 flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center border border-translucent-emerald bg-muted-moss text-xs font-mono font-semibold text-bone-white">
                          {item.step_order}
                        </div>
                        {index < typedProduct.product_items.length - 1 && (
                          <div className="mt-2 flex flex-col items-center">
                            <ArrowDown className="h-4 w-4 text-bone-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Step Content */}
                      <div className="flex-1 pb-6">
                        <div className="mb-2 flex items-center gap-2 text-xs font-mono text-bone-white/70 uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          <span>Step {item.step_order}</span>
                        </div>

                        {/* Product Card */}
                        {item.products && (
                          <ProductCard
                            name={item.products.name}
                            brand={item.products.brand}
                            usageInstructions={item.usage_instructions}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews Section */}
            <div className="mt-16 border-t border-translucent-emerald pt-12">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="font-serif text-3xl font-semibold text-bone-white">
                  Community Reviews
                </h2>
                <SubmitEvidenceButton
                  productId={typedProduct.id}
                  productTitle={typedProduct.title}
                />
              </div>
              <ReviewSection
                protocolId={typedProduct.id}
                protocolSlug={typedProduct.id}
                productTitle={typedProduct.title}
              />
            </div>

            {/* Comments Section */}
            <ProductComments
              protocolId={typedProduct.id}
              protocolSlug={typedProduct.id}
              initialComments={serializedComments}
            />
          </div>
        </main>
      </>
    );
  } catch (err) {
    console.error("Unexpected error in product detail page:", err);

    // Fallback UI if query fails
    return (
      <main className="min-h-screen bg-forest-obsidian px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <div className="border border-translucent-emerald bg-muted-moss p-8 text-center">
            <h1 className="mb-4 font-serif text-2xl font-bold text-bone-white">
              Unable to Load Product
            </h1>
            <p className="mb-6 text-bone-white/70 font-mono">
              We encountered an error while fetching the product data. Please try again later.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/products">
                <Button variant="primary" className="flex items-center gap-2">
                  <ArrowLeft size={16} />
                  Browse Products
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Return Home</Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }
}
