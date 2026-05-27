export const formatPrice = (price, lang = 'fr') => {
  if (price === undefined || price === null || price === '') return '';
  
  const isAr = lang === 'ar';
  
  if (price >= 1000000000) {
    const value = price / 1000000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليار' : 'Milliard';
    return `${formatted} ${suffix} DA`;
  }
  
  if (price >= 1000000) {
    const value = price / 1000000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'مليون' : 'Millions';
    return `${formatted} ${suffix} DA`;
  }
  
  if (price >= 1000) {
    const value = price / 1000;
    const formatted = parseFloat(value.toFixed(2));
    const suffix = isAr ? 'ألف' : 'Mille';
    return `${formatted} ${suffix} DA`;
  }

  return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : 'fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0
  }).format(price).replace('DZD', 'DA');
};
