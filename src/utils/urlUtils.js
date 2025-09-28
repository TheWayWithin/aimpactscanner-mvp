// URL normalization utilities

/**
 * Normalizes a URL to ensure it has proper protocol and format
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
export function normalizeUrl(url) {
  if (!url) return '';
  
  // Trim whitespace
  url = url.trim();
  
  // Fix common malformations
  if (url.startsWith('https//:')) {
    // Fix missing colon after https
    url = url.replace('https//:', 'https://');
  } else if (url.startsWith('http//:')) {
    // Fix missing colon after http
    url = url.replace('http//:', 'http://');
  } else if (url.startsWith('https://https//')) {
    // Fix duplicate protocol
    url = url.replace('https://https//', 'https://');
  } else if (url.startsWith('http://http//')) {
    // Fix duplicate protocol
    url = url.replace('http://http//', 'http://');
  } else if (url.startsWith('https://:')) {
    // Fix extra colon
    url = url.replace('https://:', 'https://');
  } else if (url.startsWith('http://:')) {
    // Fix extra colon
    url = url.replace('http://:', 'http://');
  }
  
  // Remove duplicate www
  url = url.replace(/\/\/www\.www\./, '//www.');
  
  // Add protocol if missing
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // Default to https for security
    url = `https://${url}`;
  }
  
  return url;
}

/**
 * Extracts the domain from a URL for display
 * @param {string} url - The URL to extract domain from
 * @returns {string} - The domain without protocol
 */
export function getDomainFromUrl(url) {
  if (!url) return '';
  
  // First normalize the URL
  url = normalizeUrl(url);
  
  // Remove protocol and www - handle both correct and malformed formats
  let domain = url
    .replace(/^https?:\/\/(www\.)?/, '') // Remove correct protocol
    .replace(/^https?\/\/:?(www\.)?/, '') // Remove malformed protocol like https//:
    .replace(/^:+/, ''); // Remove any leading colons
  
  // Get just the domain part (before any path)
  domain = domain.split('/')[0];
  
  // Final cleanup - remove any remaining protocol artifacts
  domain = domain.replace(/^:+(www\.)?/, '');
  
  return domain;
}

/**
 * Validates if a URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidUrl(url) {
  try {
    const normalized = normalizeUrl(url);
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}