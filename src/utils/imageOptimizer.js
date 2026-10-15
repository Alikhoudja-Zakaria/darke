/**
 * Optimizes image URLs for bandwidth and fast loading.
 * Dynamically switches CDN resolution prefixes (e.g., 400px for thumbnails vs 1600px for details).
 * 
 * @param {string} url - Image source URL
 * @param {'thumb' | 'medium' | 'large' | 'original'} size - Target size
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(url, size = 'thumb') {
  if (!url || typeof url !== 'string') return '';
  
  // Ouedkniss CDN resolution switching
  if (url.includes('ouedkniss.com') && url.includes('medias/announcements/images/')) {
    const targetSize = size === 'thumb' ? '400' : size === 'medium' ? '800' : '1600';
    
    // Check if URL already has a size prefix like /200/, /400/, /800/, /1600/
    const sizePrefixRegex = /(cdn\d*\.ouedkniss\.com)\/(\d{3,4})\/(medias\/)/;
    if (sizePrefixRegex.test(url)) {
      return url.replace(sizePrefixRegex, `$1/${targetSize}/$3`);
    }
    
    // If no size prefix, insert it after the domain
    const noPrefixRegex = /(cdn\d*\.ouedkniss\.com)\/(medias\/)/;
    if (noPrefixRegex.test(url)) {
      return url.replace(noPrefixRegex, `$1/${targetSize}/$2`);
    }
  }

  return url;
}

/**
 * Ultra-light SVG placeholder data URI for properties when image fails to load or 404s.
 */
export const FALLBACK_PROPERTY_IMAGE = 
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20600%20400%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20fill%3D%22%23f3f4f6%22%20width%3D%22100%25%22%20height%3D%22100%25%22%2F%3E%3Cpath%20d%3D%22M300%20140%20L220%20210%20H245%20V260%20H355%20V210%20H380%20Z%22%20fill%3D%22%23d1d5db%22%2F%3E%3Ctext%20x%3D%22300%22%20y%3D%22295%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20font-weight%3D%22600%22%20fill%3D%22%239ca3af%22%20text-anchor%3D%22middle%22%3EPhoto%20non%20disponible%3C%2Ftext%3E%3C%2Fsvg%3E";
