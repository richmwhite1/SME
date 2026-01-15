
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
    // Always return the branded molecular placeholder for consistency
    return PLACEHOLDER_IMAGES[0];
}
