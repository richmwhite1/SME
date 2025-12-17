import { createClient } from "@/lib/supabase/server";
import ProtocolCard from "@/components/holistic/ProtocolCard";

export const dynamic = "force-dynamic";

interface Protocol {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
}

export default async function ProductsPage() {
  const supabase = createClient();

  const { data: protocols, error } = await supabase
    .from("protocols")
    .select("id, title, problem_solved, slug")
    .order("title", { ascending: true });

  if (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-deep-stone md:text-5xl">
            Products
          </h1>
          <p className="text-xl text-deep-stone/70">
            Community-driven protocols for the gut, heart, and mind
          </p>
        </div>

        {protocols && protocols.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {protocols.map((protocol: Protocol) => (
              <ProtocolCard
                key={protocol.id}
                title={protocol.title}
                problemSolved={protocol.problem_solved}
                slug={protocol.slug}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
            <p className="text-deep-stone/70">No products available yet.</p>
          </div>
        )}

        {error && (
          <div className="mt-8 text-center text-red-600">
            Error loading products. Please try again later.
          </div>
        )}
      </div>
    </main>
  );
}

