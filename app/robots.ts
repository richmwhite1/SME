import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://sme-production.up.railway.app";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/private/"],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
