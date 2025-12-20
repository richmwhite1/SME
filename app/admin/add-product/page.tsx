import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import ProductOnboardForm from "@/components/admin/ProductOnboardForm";

export const dynamic = "force-dynamic";

export default async function AdminAddProductPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/feed");
  }

  // Check if user is admin (checks both Clerk publicMetadata.role and profile.is_admin)
  const adminStatus = await isAdmin();

  if (!adminStatus) {
    redirect("/feed");
  }

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-4xl font-bold text-bone-white">Product Onboarding Wizard</h1>
          <p className="text-lg text-bone-white/70 font-mono">
            Add new products with SME certification and verification details
          </p>
        </div>

        <ProductOnboardForm />
      </div>
    </main>
  );
}




