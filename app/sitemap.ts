import { MetadataRoute } from "next";
import { getDb } from "@/lib/db";

interface Product {
  id: string;
  slug: string;
  updated_at: string | null;
  created_at: string;
}

interface Discussion {
  slug: string;
  updated_at: string | null;
  created_at: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sme.example.com";
  const sql = getDb();

  let products: Product[] = [];
  let discussions: Discussion[] = [];

  try {
    // Fetch all products (protocols)
    const productsResult = await sql`
      SELECT id, slug, updated_at, created_at
      FROM products
      WHERE is_flagged IS FALSE OR is_flagged IS NULL
    `;
    products = productsResult as unknown as Product[];

    // Fetch all discussions
    const discussionsResult = await sql`
      SELECT slug, updated_at, created_at
      FROM discussions
      WHERE is_flagged IS FALSE OR is_flagged IS NULL
    `;
    discussions = discussionsResult as unknown as Discussion[];
  } catch (error) {
    console.error("Error fetching sitemap data:", error);
  }

  // Build sitemap entries
  const sitemapEntries: MetadataRoute.Sitemap = [
    // Static pages
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/discussions`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // Add product pages (using ID for canonical URLs)
  if (products) {
    products.forEach((product) => {
      sitemapEntries.push({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: product.updated_at
          ? new Date(product.updated_at)
          : product.created_at
            ? new Date(product.created_at)
            : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  }

  // Add discussion pages
  if (discussions) {
    discussions.forEach((discussion) => {
      sitemapEntries.push({
        url: `${baseUrl}/discussions/${discussion.slug}`,
        lastModified: discussion.updated_at
          ? new Date(discussion.updated_at)
          : discussion.created_at
            ? new Date(discussion.created_at)
            : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });
  }

  return sitemapEntries;
}
