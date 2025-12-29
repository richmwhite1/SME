/**
 * Fetch metadata from a URL for preview display
 * Supports regular URLs, DOI links, and PubMed links
 */

interface UrlMetadata {
    title: string;
    description?: string;
    favicon?: string;
    url: string;
}

/**
 * Detect if a string contains a URL
 */
export function detectUrl(text: string): string | null {
    // Match http://, https://, or doi: patterns
    const urlRegex = /(https?:\/\/[^\s]+|doi:\s*[^\s]+)/i;
    const match = text.match(urlRegex);
    return match ? match[0] : null;
}

/**
 * Validate if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        // Check for DOI format
        if (url.toLowerCase().startsWith('doi:')) {
            return true;
        }
        return false;
    }
}

/**
 * Normalize DOI to URL
 */
export function normalizeDoi(doi: string): string {
    const doiMatch = doi.match(/doi:\s*(.+)/i);
    if (doiMatch) {
        return `https://doi.org/${doiMatch[1].trim()}`;
    }
    return doi;
}

/**
 * Fetch metadata from a URL
 * This is a client-side function that uses an API route
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
    try {
        // Normalize DOI if needed
        const normalizedUrl = url.toLowerCase().startsWith('doi:')
            ? normalizeDoi(url)
            : url;

        // For now, return basic metadata
        // In production, you'd call an API route that uses a service like Open Graph or Metascraper
        const urlObj = new URL(normalizedUrl);

        return {
            title: urlObj.hostname,
            description: normalizedUrl,
            favicon: `https://www.google.com/s2/favicons?domain=${urlObj.hostname}`,
            url: normalizedUrl,
        };
    } catch (error) {
        console.error('Error fetching URL metadata:', error);
        return null;
    }
}

/**
 * Check if URL is a PubMed link
 */
export function isPubMedUrl(url: string): boolean {
    return url.includes('pubmed.ncbi.nlm.nih.gov');
}

/**
 * Check if URL is a DOI link
 */
export function isDoiUrl(url: string): boolean {
    return url.toLowerCase().startsWith('doi:') || url.includes('doi.org');
}
