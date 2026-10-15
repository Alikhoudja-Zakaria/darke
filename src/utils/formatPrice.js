const frFormatter = new Intl.NumberFormat('fr-DZ', {
  maximumFractionDigits: 0,
});

const arFormatter = new Intl.NumberFormat('ar-DZ', {
  maximumFractionDigits: 0,
});

/**
 * Format a price stored in DA (Dinars) for display.
 * Returns the price in the common Algerian colloquial format.
 * In Algeria, people think in centimes (1 DA = 100 centimes).
 * "15 Millions" colloquially means 15M centimes = 150,000 DA.
 *
 * @param {number|string} price - Price in DA (Dinars Algériens)
 * @param {string} lang - 'fr' or 'ar'
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, lang = 'fr') => {
  if (price === undefined || price === null || price === '') return '';
  const num = Number(price);
  if (isNaN(num)) return '';

  const isAr = lang === 'ar';
  const currency = isAr ? 'د.ج' : 'DA';

  if (num >= 1000000000) {
    const value = num / 1000000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليار' : (formatted > 1 ? 'Milliards' : 'Milliard');
    return `${formatted} ${suffix} ${currency}`;
  }

  if (num >= 1000000) {
    const value = num / 1000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليون' : (formatted > 1 ? 'Millions' : 'Million');
    return `${formatted} ${suffix} ${currency}`;
  }

  if (num >= 1000) {
    const value = num / 1000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'ألف' : 'Mille';
    return `${formatted} ${suffix} ${currency}`;
  }

  const formatter = isAr ? arFormatter : frFormatter;
  return `${formatter.format(num)} ${currency}`;
};

/**
 * Get the colloquial centimes-based description for a DA price.
 * e.g. 150,000 DA => "1.5 Milliard centimes" (but Algerians just say "1.5 Milliard")
 * This helps users who think in centimes understand the price.
 *
 * @param {number|string} price - Price in DA
 * @param {string} lang - 'fr' or 'ar'
 * @returns {string|null} Colloquial price string, or null if not applicable
 */
export const formatPriceCentimes = (price, lang = 'fr') => {
  if (price === undefined || price === null || price === '') return null;
  const num = Number(price);
  if (isNaN(num) || num < 10000) return null; // Only show for prices >= 10,000 DA

  const isAr = lang === 'ar';
  const centimes = num * 100;

  if (centimes >= 1000000000) {
    const value = centimes / 1000000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليار' : (formatted > 1 ? 'Milliards' : 'Milliard');
    return `${formatted} ${suffix}`;
  }

  if (centimes >= 1000000) {
    const value = centimes / 1000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليون' : (formatted > 1 ? 'Millions' : 'Million');
    return `${formatted} ${suffix}`;
  }

  if (centimes >= 1000) {
    const value = centimes / 1000;
    const formatted = parseFloat(value.toFixed(1));
    const suffix = isAr ? 'ألف' : 'Mille';
    return `${formatted} ${suffix}`;
  }

  return null;
};
