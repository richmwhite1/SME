import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProductWizardV2 from "@/components/wizard/ProductWizardV2";

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Submit Product | SME Protocol",
    description: "Share evidence and submit a product for community review and scientific verification.",
};

export default async function SubmitProductPage() {
    const user = await currentUser();

    // Require authentication to submit products
    if (!user) {
        redirect("/sign-in?redirect=/products/submit");
    }

    return (
        <ProductWizardV2 />
    );
}
