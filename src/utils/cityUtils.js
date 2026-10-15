import { wilayas } from '../data/cities';

// Build lookup maps for O(1) access
const cityByName = new Map();
const cityByNameAr = new Map();
const cityByCode = new Map();

wilayas.forEach(w => {
  cityByName.set(w.name.toLowerCase(), w);
  cityByNameAr.set(w.nameAr, w);
  cityByCode.set(w.code, w);
});

/**
 * Get the display name of a city based on the current language.
 * Handles lookup from French name, Arabic name, or wilaya code.
 * @param {string} cityIdentifier - The city name (FR or AR) or wilaya code
 * @param {string} lang - Current language ('fr' or 'ar')
 * @returns {string} The city name in the requested language
 */
export const getCityDisplayName = (cityIdentifier, lang) => {
  if (!cityIdentifier) return '';
  
  // Try looking up by French name
  const byName = cityByName.get(cityIdentifier.toLowerCase());
  if (byName) {
    return lang === 'ar' ? byName.nameAr : byName.name;
  }
  
  // Try looking up by Arabic name
  const byNameAr = cityByNameAr.get(cityIdentifier);
  if (byNameAr) {
    return lang === 'ar' ? byNameAr.nameAr : byNameAr.name;
  }
  
  // Try looking up by code
  const byCode = cityByCode.get(cityIdentifier);
  if (byCode) {
    return lang === 'ar' ? byCode.nameAr : byCode.name;
  }
  
  // Fallback to the original identifier
  return cityIdentifier;
};
