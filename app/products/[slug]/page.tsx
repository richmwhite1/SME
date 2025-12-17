import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ArrowDown, Clock } from "lucide-react";
import ProductCard from "@/components/holistic/ProductCard";
import ReviewSection from "@/components/holistic/ReviewSection";
import ProductComments from "@/components/products/ProductComments";
import CitationButton from "@/components/ui/CitationButton";

export const dynamic = "force-dynamic";

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
  protocol_items: ProtocolItem[];
}

export default async function ProtocolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createClient();

  const { data: protocol, error } = await supabase
    .from("protocols")
    .select(
      "id, title, problem_solved, slug, reference_url, protocol_items(step_order, usage_instructions, products(name, brand))"
    )
    .eq("slug", slug)
    .single();

  if (error || !protocol) {
    notFound();
  }

  // Type assertion for the protocol with items
  const typedProtocol = protocol as Protocol;

  // Sort protocol items by step_order
  const sortedItems = (typedProtocol.protocol_items || []).sort(
    (a, b) => a.step_order - b.step_order
  );

  // Fetch comments for this product
  const { data: comments } = await supabase
    .from("product_comments")
    .select(`
      id,
      content,
      created_at,
      profiles!product_comments_author_id_fkey(
        full_name,
        username,
        avatar_url,
        badge_type
      )
    `)
    .eq("protocol_id", typedProtocol.id)
    .eq("is_flagged", false)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-deep-stone md:text-5xl lg:text-6xl">
            {typedProtocol.title}
          </h1>
          <p className="mb-4 text-xl text-deep-stone/70 md:text-2xl">
            {typedProtocol.problem_solved}
          </p>
          {typedProtocol.reference_url && (
            <div className="flex justify-center">
              <CitationButton url={typedProtocol.reference_url} />
            </div>
          )}
        </div>

        {/* Timeline Steps */}
        <div className="space-y-8">
          {sortedItems.map((item, index) => (
            <div key={item.step_order} className="relative">
              {/* Step Number Circle */}
              <div className="flex items-start gap-6">
                <div className="flex flex-shrink-0 flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-earth-green text-lg font-semibold text-sand-beige">
                    {item.step_order}
                  </div>
                  {index < sortedItems.length - 1 && (
                    <div className="mt-2 flex flex-col items-center">
                      <ArrowDown className="h-6 w-6 text-soft-clay" />
                    </div>
                  )}
                </div>

                {/* Step Content */}
                <div className="flex-1 pb-8">
                  <div className="mb-4 flex items-center gap-2 text-sm text-deep-stone/60">
                    <Clock className="h-4 w-4" />
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

        {/* Reviews Section */}
        <ReviewSection
          protocolId={typedProtocol.id}
          protocolSlug={typedProtocol.slug}
        />

        {/* Comments Section */}
        <ProductComments
          protocolId={typedProtocol.id}
          protocolSlug={typedProtocol.slug}
          initialComments={(comments || []) as any}
        />
      </div>
    </main>
  );
}

