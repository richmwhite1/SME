
const PLACEHOLDER_IMAGES = [
    '/placeholders/molecular.png',
    '/placeholders/botanical.png',
    '/placeholders/crystalline.png',
];

/**
 * Returns a deterministic beautiful placeholder image based on the product ID.
 * This ensures that the same product always gets the same high-quality placeholder.
 */
export function getPlaceholderImage(productId: string): string {
    if (!productId) return PLACEHOLDER_IMAGES[0];

    // Simple hash function to convert UUID/String to an index
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        hash = productId.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Ensure positive index within bounds
    const index = Math.abs(hash) % PLACEHOLDER_IMAGES.length;

    return PLACEHOLDER_IMAGES[index];
}
