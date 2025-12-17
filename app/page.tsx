import Link from "next/link";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import ProtocolCard from "@/components/holistic/ProtocolCard";

export const dynamic = "force-dynamic";

interface Protocol {
  id: string;
  title: string;
  problem_solved: string;
  slug: string;
}

export default async function Home() {
  const supabase = createClient();

  const { data: protocols, error } = await supabase
    .from("protocols")
    .select("id, title, problem_solved, slug")
    .order("title", { ascending: true });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-sand-beige px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-deep-stone md:text-6xl lg:text-7xl">
            Restore Your Homeostasis.
          </h1>
          <p className="mb-12 text-xl text-deep-stone/80 md:text-2xl">
            Community-driven protocols for the gut, heart, and mind.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/products">
              <Button variant="primary" className="text-lg px-8 py-4">
                Find a Protocol
              </Button>
            </Link>
            <Link href="/community">
              <Button variant="outline" className="text-lg px-8 py-4">
                Join the Community
              </Button>
            </Link>
          </div>
        </div>

        {/* Protocols List */}
        {protocols && protocols.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-8 text-3xl font-semibold text-deep-stone">
              Available Protocols
            </h2>
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
          </div>
        )}

        {error && (
          <div className="mt-8 text-center text-deep-stone/70">
            Unable to load protocols. Please try again later.
          </div>
        )}

        {protocols && protocols.length === 0 && (
          <div className="mt-8 text-center text-deep-stone/70">
            No protocols available yet. Check back soon!
          </div>
        )}
      </div>
    </main>
  );
}

