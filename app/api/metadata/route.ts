import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface OpenGraphData {
    title?: string;
    description?: string;
    siteName?: string;
    image?: string;
}

async function fetchUrlMetadata(url: string): Promise<OpenGraphData> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SME-Bot/1.0; +https://sme.app)'
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Extract Open Graph tags
        const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogDescription = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogSiteName = html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i)?.[1];
        const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];

        // Fallback to standard meta tags
        const metaDescription = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1];
        const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1];

        // Extract favicon
        const faviconLink = html.match(/<link\s+[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i)?.[1];
        const urlObj = new URL(url);
        const favicon = faviconLink
            ? (faviconLink.startsWith('http') ? faviconLink : `${urlObj.origin}${faviconLink}`)
            : `${urlObj.origin}/favicon.ico`;

        return {
            title: ogTitle || titleTag || urlObj.hostname,
            description: ogDescription || metaDescription,
            siteName: ogSiteName || urlObj.hostname.replace('www.', ''),
            image: favicon
        };
    } catch (error) {
        console.error('Error fetching metadata:', error);

        // Return minimal fallback data
        const urlObj = new URL(url);
        return {
            title: urlObj.hostname,
            siteName: urlObj.hostname.replace('www.', ''),
            image: `${urlObj.origin}/favicon.ico`
        };
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const url = searchParams.get('url');

        if (!url) {
            return NextResponse.json(
                { error: 'URL parameter is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        const metadata = await fetchUrlMetadata(url);

        return NextResponse.json({
            title: metadata.title,
            description: metadata.description,
            siteName: metadata.siteName,
            favicon: metadata.image
        });
    } catch (error) {
        console.error('Metadata API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch metadata' },
            { status: 500 }
        );
    }
}
