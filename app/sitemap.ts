import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = createClient();

  // Fetch all products (protocols)
  const { data: products } = await supabase
    .from("protocols")
    .select("id, slug, updated_at, created_at")
    .eq("is_flagged", false)
    .or("is_flagged.is.null") as { data: Product[] | null };

  // Fetch all discussions
  const { data: discussions } = await supabase
    .from("discussions")
    .select("slug, updated_at, created_at")
    .eq("is_flagged", false)
    .or("is_flagged.is.null") as { data: Discussion[] | null };

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





