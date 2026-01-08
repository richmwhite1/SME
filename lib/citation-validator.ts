/**
 * Citation Validation Utilities
 * Validates citation formats (URL/DOI) and checks against approved academic/medical domains
 */

export interface CitationValidationResult {
    isValid: boolean;
    reason?: string;
    format?: 'url' | 'doi';
    domain?: string;
}

/**
 * Approved academic and medical source domains
 * Citations from these domains will be flagged as pre-screened
 */
const APPROVED_DOMAINS = [
    'pubmed.ncbi.nlm.nih.gov',
    'nih.gov',
    'thelancet.com',
    'jamanetwork.com',
    'nejm.org',
    'bmj.com',
    'nature.com',
    'sciencedirect.com',
    'springer.com',
    'wiley.com',
    'plos.org',
    'doi.org',
    // Allow subdomains
    'ncbi.nlm.nih.gov',
    'www.nih.gov',
    'www.thelancet.com',
    'www.nejm.org',
    'www.bmj.com',
    'www.nature.com',
    'www.sciencedirect.com',
    'link.springer.com',
    'onlinelibrary.wiley.com',
    'journals.plos.org',
];

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Check if domain is in approved list
 * Supports exact matches and subdomain matching
 */
function isApprovedDomain(domain: string): boolean {
    const lowerDomain = domain.toLowerCase();

    // Check exact match
    if (APPROVED_DOMAINS.includes(lowerDomain)) {
        return true;
    }

    // Check if domain ends with any approved domain (subdomain matching)
    return APPROVED_DOMAINS.some(approved => {
        // Remove www. prefix for comparison
        const cleanDomain = lowerDomain.replace(/^www\./, '');
        const cleanApproved = approved.replace(/^www\./, '');

        return cleanDomain === cleanApproved || cleanDomain.endsWith('.' + cleanApproved);
    });
}

/**
 * Validate URL format
 */
function isValidUrlFormat(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Validate DOI format
 */
function isValidDoiFormat(doi: string): boolean {
    return doi.toLowerCase().startsWith('doi:');
}

/**
 * Validate citation format and domain
 * Returns detailed validation result
 */
export function validateCitation(citation: string): CitationValidationResult {
    if (!citation || !citation.trim()) {
        return {
            isValid: false,
            reason: 'Citation is empty'
        };
    }

    const trimmedCitation = citation.trim();

    // Check if it's a DOI
    if (isValidDoiFormat(trimmedCitation)) {
        // DOIs are always approved (they resolve through doi.org)
        return {
            isValid: true,
            format: 'doi',
            domain: 'doi.org'
        };
    }

    // Check if it's a valid URL format
    if (!isValidUrlFormat(trimmedCitation)) {
        return {
            isValid: false,
            reason: 'Citation must be a valid URL (starting with http:// or https://) or DOI (starting with doi:)'
        };
    }

    // Extract domain
    const domain = extractDomain(trimmedCitation);
    if (!domain) {
        return {
            isValid: false,
            reason: 'Could not extract domain from URL'
        };
    }

    // Check if domain is approved
    if (!isApprovedDomain(domain)) {
        return {
            isValid: false,
            reason: `Domain "${domain}" is not in the approved list of academic/medical sources`,
            format: 'url',
            domain
        };
    }

    return {
        isValid: true,
        format: 'url',
        domain
    };
}

/**
 * Quick check if citation passes validation
 */
export function isCitationValid(citation: string): boolean {
    return validateCitation(citation).isValid;
}

/**
 * Get list of approved domains (for display purposes)
 */
export function getApprovedDomains(): string[] {
    return [...APPROVED_DOMAINS];
}
