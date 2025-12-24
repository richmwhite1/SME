/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function getYouTubeID(url: string): string | null {
    if (!url) return null;

    // Handle youtu.be short URLs
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1];

    // Handle youtube.com/watch?v= URLs
    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (watchMatch) return watchMatch[1];

    // Handle youtube.com/embed/ URLs
    const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1];

    // If no match, return the original URL (might already be just the ID)
    return url;
}
