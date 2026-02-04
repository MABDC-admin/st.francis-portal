/**
 * Text formatting utilities for proper capitalization
 */

/**
 * Converts text to Title Case (proper capitalization)
 * Example: "JOHN DOE" -> "John Doe"
 * Example: "john doe" -> "John Doe"
 */
export const toTitleCase = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Formats a full name properly (handles suffixes like Jr., Sr., III, etc.)
 */
export const formatName = (name: string | null | undefined): string => {
    if (!name) return '';

    const suffixes = ['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv', 'v'];

    return name
        .toLowerCase()
        .split(' ')
        .map(word => {
            // Keep suffixes properly cased
            if (suffixes.includes(word.replace('.', ''))) {
                if (word.includes('.')) return word.charAt(0).toUpperCase() + word.slice(1);
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

/**
 * Formats address text
 */
export const formatAddress = (address: string | null | undefined): string => {
    if (!address) return '';

    // Common abbreviations that should stay uppercase
    const abbrevs = ['st', 'rd', 'ave', 'blvd', 'dr', 'ln', 'ct', 'pl'];

    return address
        .toLowerCase()
        .split(' ')
        .map((word, idx, arr) => {
            // Keep numbers as-is
            if (/^\d+$/.test(word)) return word;
            // Handle numbered streets (1st, 2nd, etc.)
            if (/^\d+(st|nd|rd|th)$/.test(word)) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};
