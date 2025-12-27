import { getDb } from "@/lib/db";
import { notFound } from "next/navigation";
import ProductEditorClient from "./ProductEditorClient";

interface PageProps {
    params: {
        id: string;
    };
}

export default async function AdminProductEditPage({ params }: PageProps) {
    const db = getDb();

    // Fetch product data
    const products = await db`
    SELECT 
      id,
      name,
      title,
      category,
      brand,
      company_blurb,
      product_photos,
      youtube_link,
      technical_specs,
      created_at,
      updated_at
    FROM products
    WHERE id = ${params.id}
  `;

    if (products.length === 0) {
        notFound();
    }

    const product = products[0];

    // Parse JSONB fields
    const productData = {
        ...product,
        product_photos: product.product_photos || [],
        technical_specs: product.technical_specs || {},
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] font-mono p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-emerald-500 uppercase tracking-tight">
                        Admin Product Editor
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        Edit product details, manage photos, and preview SME view
                    </p>
                </div>

                <ProductEditorClient product={productData as any} />
            </div>
        </div>
    );
}
