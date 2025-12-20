import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";
import ProductOnboardForm from "@/components/admin/ProductOnboardForm";
export const dynamic = "force-dynamic";
export default async function AdminOnboardPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/feed");
  }
  // Check if user is admin
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect("/feed");
  }
  // Fetch existing products for editing (optional - can be enhanced later)
  const sql = getDb();
  let products = [];
  try {
    products = await sql`
      SELECT id, title, slug
      FROM protocols
      ORDER BY created_at DESC
      LIMIT 50
    `;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold text-bone-white">Product Onboarding Wizard</h1>
          <p className="text-lg text-bone-white/70 font-mono">
            Add new products or update existing ones with certification details
          </p>
        </div>
        <ProductOnboardForm existingProducts={products} />
      </div>
    </main>
  );
}
