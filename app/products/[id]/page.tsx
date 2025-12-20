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
  try {
    const { data: protocol } = await supabase
      .from("protocols")
      .select("title, ai_summary, is_sme_certified, images")
      .eq("id", id)
      .single();
    if (!protocol) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }
    // Type assertion for protocol data
    const protocolData = protocol as {
      title: string;
      ai_summary: string | null;
      is_sme_certified: boolean | null;
      images: string[] | null;
    };
    // Prefix title with certified badge if SME certified
    const titlePrefix = protocolData.is_sme_certified ? "✅ Certified: " : "";
    const title = `${titlePrefix}${protocolData.title}`;
    // Use first 160 characters of ai_summary as description
    const description = protocolData.ai_summary
      ? protocolData.ai_summary.substring(0, 160).replace(/\n/g, " ").trim()
      : `Transparency report for ${protocolData.title}. Research-based analysis and verification.`;
    // Get first image for Open Graph
    let imageUrl: string | undefined;
    if (protocolData.images && Array.isArray(protocolData.images) && protocolData.images.length > 0) {
      imageUrl = protocolData.images[0];
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
interface ProtocolItem {
  step_order: number;
  usage_instructions: string;
  products: {
    name: string;
    brand: string;
  } | null;
}
interface Protocol {
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
  protocol_items: ProtocolItem[];
}
export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params (Next.js 15+ requirement)
  const { id } = await params;
  
  console.log("Product Detail Page - Fetching product with ID:", id);
  try {
    // Explicit fetch by ID - explicitly select images array to ensure proper handling
    console.log("Fetching product with ID:", id);
    console.log("ID type:", typeof id);
    console.log("ID length:", id?.length);
    
    const { data: protocol, error } = await supabase
      .from("protocols")
      .select(`
        *,
        images
      `)
      .eq("id", id)
      .single();
    if (error) {
      console.error("Supabase error fetching protocol:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("ID attempted:", id);
      
      // Try to fetch all products to see what IDs exist
      const { data: allProducts } = await supabase
        .from("protocols")
        .select("id, title, slug")
        .limit(5);
      console.log("Sample product IDs in database:", allProducts?.map((p: any) => ({ id: p.id, title: p.title, slug: p.slug })));
      
      notFound();
    }
    if (!protocol) {
      console.error("Protocol not found for ID:", id);
      console.error("This might mean the ID doesn't exist in the database");
      notFound();
    }
    console.log("Product found:", (protocol as any).title);
    console.log("Product ID:", (protocol as any).id);
    // Type assertion - ensure we have a valid protocol object
    if (!protocol || typeof protocol !== 'object') {
      console.error("Invalid protocol data received:", protocol);
      notFound();
    }
    
    const typedProtocol = protocol as Protocol;
    // Debug: Log images data
    console.log("Raw images data from DB:", typedProtocol.images);
    console.log("Images type:", typeof typedProtocol.images);
    console.log("Is array?", Array.isArray(typedProtocol.images));
    console.log("Images value:", JSON.stringify(typedProtocol.images));
    
    // Handle images - PostgreSQL TEXT[] arrays should come as arrays from Supabase
    // But sometimes they come as strings or need special handling
    let imagesArray: string[] = [];
    
    if (typedProtocol.images) {
      if (Array.isArray(typedProtocol.images)) {
        // Direct array - this is the expected format
        imagesArray = typedProtocol.images.filter((img): img is string => typeof img === 'string' && img.length > 0);
        console.log("Images are already an array, using directly");
      } else if (typeof typedProtocol.images === 'string') {
        // String format - try to parse
        console.log("Images are a string, attempting to parse");
        const imagesString: string = typedProtocol.images;
        try {
          // Try JSON parse first
          const parsed = JSON.parse(imagesString);
          if (Array.isArray(parsed)) {
            imagesArray = parsed.filter((img: any): img is string => typeof img === 'string' && img.length > 0);
          } else {
            // Might be a PostgreSQL array string like "{url1,url2}"
            const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
            if (arrayMatch) {
              imagesArray = arrayMatch[1]
                .split(',')
                .map((s: string) => s.trim().replace(/^"|"$/g, ''))
                .filter((img: string): img is string => img.length > 0);
            }
          }
        } catch (e) {
          console.error("Failed to parse images:", e);
          // Try PostgreSQL array format: {url1,url2}
          const arrayMatch = imagesString.match(/^\{([^}]*)\}$/);
          if (arrayMatch) {
            imagesArray = arrayMatch[1]
              .split(',')
              .map((s: string) => s.trim().replace(/^"|"$/g, ''))
              .filter((img: string): img is string => img.length > 0);
          }
        }
      }
    }
    
    console.log("Processed images array:", imagesArray);
    console.log("Images array length:", imagesArray.length);
    imagesArray.forEach((img, idx) => {
      console.log(`  Image ${idx}:`, img);
    });
    // Image protection - images should already be full URLs from upload
    // Just validate they're valid URLs
    const safeImages = imagesArray.length > 0
      ? imagesArray
          .filter((img): img is string => {
            // Only keep valid URLs
            const isValid = !!img && typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'));
            if (!isValid && img) {
              console.warn("Invalid image URL filtered out:", img);
            }
            return isValid;
          })
      : [];
    
    console.log("Safe images after filtering:", safeImages);
    console.log("Safe images count:", safeImages.length);
    console.log("Safe images after filtering:", safeImages);
    console.log("Safe images count:", safeImages.length);
    // Sort protocol items by step_order
    const sortedItems = (typedProtocol.protocol_items || []).sort(
      (a, b) => a.step_order - b.step_order
    );
    // Fetch comments for this product with error handling
    let serializedComments: any[] = [];
    try {
      const { data: comments, error: commentsError } = await supabase
        .from("product_comments")
        .select(`
          id,
          content,
          created_at,
          parent_id,
          profiles!product_comments_author_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            badge_type,
            contributor_score
          )
        `)
        .eq("protocol_id", typedProtocol.id)
        .eq("is_flagged", false)
        .order("created_at", { ascending: true });
      if (commentsError) {
        console.error("Error fetching product comments:", commentsError);
        // Continue with empty comments array instead of failing
      } else {
        // Serialize comments data - convert Date objects to ISO strings
        // Map author_id to archive_clerk_id if applicable
        serializedComments = (comments || []).map((comment: any) => ({
          ...comment,
          created_at: comment.created_at instanceof Date 
            ? comment.created_at.toISOString() 
            : typeof comment.created_at === 'string' 
              ? comment.created_at 
              : new Date(comment.created_at).toISOString(),
          profiles: comment.profiles ? {
            ...comment.profiles,
            // Ensure all profile fields are serializable
            // Use archive_clerk_id if available, otherwise use id
            id: String(comment.profiles.id),
            archive_clerk_id: comment.profiles.archive_clerk_id || comment.profiles.id,
            contributor_score: comment.profiles.contributor_score ?? null,
          } : null,
        }));
      }
    } catch (commentsErr) {
      console.error("Unexpected error fetching comments:", commentsErr);
      // Continue with empty comments array
      serializedComments = [];
    }
    // Check if product is SME certified
    const isSMECertified = typedProtocol.is_sme_certified === true;
    // Build base URL for canonical and structured data
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
    const canonicalUrl = `${baseUrl}/products/${id}`;
    // Build JSON-LD structured data for SEO
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: typedProtocol.title,
      description: typedProtocol.ai_summary 
        ? typedProtocol.ai_summary.substring(0, 200).replace(/\n/g, " ").trim()
        : typedProtocol.problem_solved,
      image: safeImages.length > 0 ? safeImages : undefined,
      ...(typedProtocol.buy_url && {
        offers: {
          "@type": "Offer",
          url: typedProtocol.buy_url,
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
          ...(typedProtocol.source_transparency ? [{
            "@type": "PropertyValue",
            name: "Source Transparency",
            value: "Verified",
          }] : []),
          ...(typedProtocol.purity_tested ? [{
            "@type": "PropertyValue",
            name: "Purity Tested",
            value: "Verified",
          }] : []),
          ...(typedProtocol.potency_verified ? [{
            "@type": "PropertyValue",
            name: "Potency Verified",
            value: "Verified",
          }] : []),
          ...(typedProtocol.excipient_audit ? [{
            "@type": "PropertyValue",
            name: "Excipient Audit",
            value: "Verified",
          }] : []),
          ...(typedProtocol.operational_legitimacy ? [{
            "@type": "PropertyValue",
            name: "Operational Legitimacy",
            value: "Verified",
          }] : []),
        ],
      }),
      // Add FactCheck schema for research-based analysis
      ...(typedProtocol.ai_summary && {
        mainEntity: {
          "@type": "Article",
          headline: `${typedProtocol.title} - Transparency Report`,
          description: typedProtocol.ai_summary.substring(0, 200).replace(/\n/g, " ").trim(),
          author: {
            "@type": "Organization",
            name: "SME Research Team",
          },
          ...(typedProtocol.reference_url && {
            citation: typedProtocol.reference_url,
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
                    {typedProtocol.title}
                  </h1>
                  <p className="text-base text-bone-white/80 leading-relaxed">
                    {typedProtocol.problem_solved}
                  </p>
                </div>
                {/* SME Certified Badge */}
                {isSMECertified && (
                  <div>
                    <SMECertifiedBadge
                      thirdPartyLabVerified={typedProtocol.third_party_lab_verified || false}
                      purityTested={typedProtocol.purity_tested || false}
                      sourceTransparency={typedProtocol.source_transparency || false}
                      potencyVerified={typedProtocol.potency_verified || false}
                      excipientAudit={typedProtocol.excipient_audit || false}
                      operationalLegitimacy={typedProtocol.operational_legitimacy || false}
                    />
                  </div>
                )}
                {/* 5-Pillar Transparency Checklist - High-Density Data Stack */}
                {isSMECertified && (
                  <TransparencyCard
                    sourceTransparency={typedProtocol.source_transparency || false}
                    purityTested={typedProtocol.purity_tested || false}
                    potencyVerified={typedProtocol.potency_verified || false}
                    excipientAudit={typedProtocol.excipient_audit || false}
                    operationalLegitimacy={typedProtocol.operational_legitimacy || false}
                    thirdPartyLabVerified={typedProtocol.third_party_lab_verified || false}
                    certificationNotes={typedProtocol.certification_notes}
                  />
                )}
                {/* Purchase Button - SME Gold */}
                {typedProtocol.buy_url && (
                  <a 
                    href={typedProtocol.buy_url.includes("?") ? `${typedProtocol.buy_url}&ref=SME` : `${typedProtocol.buy_url}?ref=SME`} 
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
                  <CompareButton productId={typedProtocol.id} productTitle={typedProtocol.title} />
                  {typedProtocol.reference_url && (
                    <CitationButton url={typedProtocol.reference_url} />
                  )}
                  {typedProtocol.coa_url && (
                    <a
                      href={typedProtocol.coa_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-translucent-emerald bg-muted-moss px-3 py-1.5 text-xs text-bone-white hover:bg-forest-obsidian hover:border-heart-green transition-colors font-mono uppercase"
                    >
                      <FileText size={12} />
                      COA
                    </a>
                  )}
                  <ShareToX
                    title={typedProtocol.title}
                    url={`/products/${typedProtocol.id}`}
                    type="product"
                  />
                </div>
              </div>
            </div>
            {/* AI Summary / Expert Notebook - Full Width Below Grid */}
            {typedProtocol.ai_summary && (
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
                  <ReactMarkdown>{typedProtocol.ai_summary}</ReactMarkdown>
                </div>
              </div>
            )}
            {/* Timeline Steps - Clinical Layout */}
            {sortedItems.length > 0 && (
              <div className="mb-12 space-y-6">
                <h2 className="font-serif text-xl font-bold text-bone-white mb-6">Product Steps</h2>
                {sortedItems.map((item, index) => (
                  <div key={item.step_order} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-shrink-0 flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center border border-translucent-emerald bg-muted-moss text-xs font-mono font-semibold text-bone-white">
                          {item.step_order}
                        </div>
                        {index < sortedItems.length - 1 && (
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
                productId={typedProtocol.id}
                productTitle={typedProtocol.title}
              />
            </div>
            <ReviewSection
              protocolId={typedProtocol.id}
              protocolSlug={typedProtocol.id}
              productTitle={typedProtocol.title}
            />
          </div>
          {/* Comments Section */}
          <ProductComments
            protocolId={typedProtocol.id}
            protocolSlug={typedProtocol.id}
            initialComments={serializedComments}
          />
        </div>
      </main>
      </>
    );
  } catch (err) {
    console.error("Unexpected error in product detail page:", err);
    
    // Fallback UI if Supabase query fails
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
