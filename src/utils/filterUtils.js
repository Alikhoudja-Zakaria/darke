import { wilayas } from '../data/cities.js';

export const normalizeText = (text) => {
  if (!text) return '';
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

// Common Algerian communes mapped to their respective Wilaya
export const communeToWilaya = {
  // Alger (16)
  "ain taya": "Alger",
  "staoueli": "Alger",
  "cheraga": "Alger",
  "bordj el kiffan": "Alger",
  "bordj el bahri": "Alger",
  "bab ezzouar": "Alger",
  "el harrach": "Alger",
  "hussein dey": "Alger",
  "hydra": "Alger",
  "kouba": "Alger",
  "rouiba": "Alger",
  "zeralda": "Alger",
  "draria": "Alger",
  "dely ibrahim": "Alger",
  "bir mourad rais": "Alger",
  "ben aknoun": "Alger",
  "alger centre": "Alger",
  "belouizdad": "Alger",
  "mohammadia": "Alger",
  "reghaia": "Alger",
  "oued smar": "Alger",
  "dar el beida": "Alger",
  "ouled fayet": "Alger",
  "beni messous": "Alger",
  "ain benian": "Alger",
  "bouzareah": "Alger",
  "baraki": "Alger",
  "bachedjerrah": "Alger",
  "casbah": "Alger",
  "el biar": "Alger",
  "el mouradia": "Alger",
  "sidi fredj": "Alger",
  "bainem": "Alger",
  "said hamdine": "Alger",
  "rais hamidou": "Alger",
  "birtouta": "Alger",
  "saoula": "Alger",
  "douera": "Alger",
  "khraicia": "Alger",
  "baba hassen": "Alger",
  "souidania": "Alger",
  "mahelma": "Alger",
  "rahmania": "Alger",
  "el achour": "Alger",

  // Blida (09)
  "chrea": "Blida",
  "boufarik": "Blida",
  "ouled yaich": "Blida",
  "beni mered": "Blida",
  "mouzaia": "Blida",
  "el affroun": "Blida",

  // Boumerdès (35)
  "khemis el khechna": "Boumerdès",
  "corso": "Boumerdès",
  "thenia": "Boumerdès",
  "boudouaou": "Boumerdès",
  "zemmouri": "Boumerdès",
  "dellys": "Boumerdès",
  "issers": "Boumerdès",

  // Tipaza (42)
  "kolea": "Tipaza",
  "bou ismail": "Tipaza",
  "fouka": "Tipaza",
  "cherchell": "Tipaza",
  "douaouda": "Tipaza",
  "hadjout": "Tipaza",
  "ahmar el ain": "Tipaza",

  // Oran (31)
  "canastel": "Oran",
  "bir el djir": "Oran",
  "es senia": "Oran",
  "ain el turck": "Oran",
  "arzew": "Oran",
  "bethioua": "Oran",
  "mers el kebir": "Oran",

  // Béjaïa (06)
  "akbou": "Béjaïa",
  "sidi aich": "Béjaïa",
  "beni ksila": "Béjaïa",
  "tichy": "Béjaïa",
  "aokas": "Béjaïa",
  "souk el tenine": "Béjaïa",

  // Annaba (23)
  "seraidi": "Annaba",
  "berrahal": "Annaba",
  "el bouni": "Annaba",
  "sidi amar": "Annaba",

  // Constantine (25)
  "ali mendjeli": "Constantine",
  "el khroub": "Constantine",
  "hamma bouziane": "Constantine",
  "didouche mourad": "Constantine",

  // Sétif (19)
  "el eulma": "Sétif",
  "ain arnat": "Sétif",
  "ain oulmene": "Sétif",

  // Tizi Ouzou (15)
  "azazga": "Tizi Ouzou",
  "tigzirt": "Tizi Ouzou",
  "boghni": "Tizi Ouzou",
  "draa el mizan": "Tizi Ouzou"
};

// Safe price parser
export const parsePrice = (val) => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

// Detect room count from item or title
export const extractRooms = (item) => {
  if (item.rooms !== undefined && item.rooms !== null && item.rooms !== '') {
    const r = parseInt(item.rooms, 10);
    if (!isNaN(r)) return r;
  }
  // Try to find "F2", "F3", "F4", "Studio", etc. in title
  const title = (item.title || '').toLowerCase();
  const fMatch = title.match(/\bf(\d+)\b/);
  if (fMatch) {
    return parseInt(fMatch[1], 10);
  }
  if (title.includes('studio')) return 1;
  const piecesMatch = title.match(/(\d+)\s*(pi[eè]ces|chambres)/);
  if (piecesMatch) {
    return parseInt(piecesMatch[1], 10);
  }
  return null;
};

// Match Wilaya / City
export const matchesWilaya = (item, selectedCity) => {
  if (!selectedCity) return true;
  const targetNorm = normalizeText(selectedCity);
  const wilayaObj = wilayas.find(w => normalizeText(w.name) === targetNorm || w.nameAr === selectedCity);
  const arabicTarget = wilayaObj?.nameAr || '';

  // 1. Direct wilaya property match
  if (item.wilaya && normalizeText(item.wilaya) === targetNorm) return true;

  // 2. City property match (either directly wilaya name or commune)
  const itemCityNorm = normalizeText(item.city);
  if (itemCityNorm === targetNorm) return true;
  if (communeToWilaya[itemCityNorm] && normalizeText(communeToWilaya[itemCityNorm]) === targetNorm) return true;

  // 3. Arabic matches
  if (arabicTarget) {
    if (item.city === arabicTarget || item.wilaya === arabicTarget) return true;
    if (item.title && item.title.includes(arabicTarget)) return true;
  }

  // 4. In title or description
  const titleNorm = normalizeText(item.title);
  if (titleNorm.includes(targetNorm)) return true;

  // 5. Check if title contains any known commune of the target wilaya
  for (const [commune, wilaya] of Object.entries(communeToWilaya)) {
    if (normalizeText(wilaya) === targetNorm && titleNorm.includes(commune)) {
      return true;
    }
  }

  return false;
};

// Match Transaction Type (Buy/Sale vs Rent)
export const matchesTransactionType = (item, selectedType) => {
  if (!selectedType || selectedType === 'all') return true;
  const type = String(selectedType).toLowerCase();

  const isExplicitSale = item.transactionType === 'buy' || item.transactionType === 'sale';
  const isExplicitRent = item.transactionType === 'rent' || item.priceUnit === 'per-month' || item.priceUnit === 'per-night' || item.category === 'leisure';

  const title = (item.title || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const full = `${title} ${desc}`;
  const textHasSale = full.includes('vente') || full.includes('achat') || full.includes('achète') || full.includes('بيع') || full.includes('شراء');
  const textHasRent = full.includes('location') || full.includes('louer') || full.includes('rent') || full.includes('كراء') || full.includes('إيجار');

  if (type === 'buy' || type === 'sale') {
    if (isExplicitSale) return true;
    if (textHasSale && !isExplicitRent) return true;
    if (item.priceUnit === 'total' && !isExplicitRent && !textHasRent) return true;
    return false;
  }

  if (type === 'rent') {
    if (isExplicitRent) return true;
    if (textHasRent && !isExplicitSale) return true;
    return false;
  }

  return true;
};

// Match Property Type
export const matchesPropertyType = (item, selectedType) => {
  if (!selectedType) return true;
  const target = normalizeText(selectedType);
  const itemType = normalizeText(item.propertyType);

  if (itemType === target) return true;

  const titleNorm = normalizeText(item.title);
  const descNorm = normalizeText(item.description);
  const fullText = `${titleNorm} ${descNorm}`;

  switch (target) {
    case 'apartment':
      return itemType === 'appartement' || 
             /\b(f[1-9]|appartement|apartment|duplex|شقة|شقق)\b/.test(fullText);
    case 'villa':
      return itemType === 'villa' || fullText.includes('villa') || fullText.includes('فيلا');
    case 'house':
      return itemType === 'house' || itemType === 'maison' || fullText.includes('maison') || fullText.includes('منزل') || fullText.includes('حوش') || fullText.includes('دار');
    case 'studio':
      return itemType === 'studio' || fullText.includes('studio') || fullText.includes('ستوديو');
    case 'commercial':
      return itemType === 'commercial' || 
             itemType === 'local' || 
             itemType === 'bureau' || 
             fullText.includes('commercial') || 
             fullText.includes('local') || 
             fullText.includes('bureau') || 
             fullText.includes('magasin') || 
             fullText.includes('hangar') || 
             fullText.includes('محل') || 
             fullText.includes('تجاري') || 
             fullText.includes('مكتب');
    case 'land':
      return itemType === 'land' || 
             itemType === 'terrain' || 
             fullText.includes('terrain') || 
             fullText.includes('land') || 
             fullText.includes('lot de terrain') || 
             fullText.includes('أرض') || 
             fullText.includes('قطعة أرض');
    default:
      return itemType.includes(target) || fullText.includes(target);
  }
};

// Multi-word search matching
export const matchesSearchQuery = (item, searchQuery) => {
  if (!searchQuery || !searchQuery.trim()) return true;
  const rawTokens = searchQuery.trim().split(/\s+/).map(normalizeText).filter(Boolean);
  if (rawTokens.length === 0) return true;

  // Build searchable text
  const title = normalizeText(item.title);
  const city = normalizeText(item.city);
  const wilaya = normalizeText(item.wilaya);
  const desc = normalizeText(item.description);
  const propType = normalizeText(item.propertyType);
  const address = normalizeText(item.address);
  const category = normalizeText(item.category);

  // Also include Arabic city name if city matches
  const wilayaObj = wilayas.find(w => normalizeText(w.name) === wilaya || normalizeText(w.name) === city);
  const cityAr = wilayaObj ? wilayaObj.nameAr : '';

  const haystack = `${title} ${city} ${wilaya} ${cityAr} ${desc} ${propType} ${address} ${category}`;

  // Every token must match somewhere in the listing
  return rawTokens.every(token => haystack.includes(token));
};

/**
 * Filter an array of listings based on search query and filter object
 * @param {Array} items - Raw listings
 * @param {string} searchQuery - Search query string
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered listings
 */
export const filterListings = (items = [], searchQuery = '', filters = {}) => {
  if (!Array.isArray(items)) return [];

  const minPrice = parsePrice(filters.minPrice);
  const maxPrice = parsePrice(filters.maxPrice);
  const roomsFilter = filters.rooms ? parseInt(filters.rooms, 10) : null;
  const hasFurnishedFilter = filters.furnished !== undefined && filters.furnished !== '';
  const expectedFurnished = hasFurnishedFilter ? (filters.furnished === 'true' || filters.furnished === true) : null;

  return items.filter(item => {
    // 1. Search Query
    if (!matchesSearchQuery(item, searchQuery)) {
      return false;
    }

    // 2. Transaction Type (Buy vs Rent)
    if (filters.transactionType && !matchesTransactionType(item, filters.transactionType)) {
      return false;
    }

    // 3. Wilaya / City
    if (filters.city && !matchesWilaya(item, filters.city)) {
      return false;
    }

    // 4. Property Type
    if (filters.propertyType && !matchesPropertyType(item, filters.propertyType)) {
      return false;
    }

    // 5. Price Min
    if (minPrice !== null) {
      const itemPrice = parsePrice(item.price);
      if (itemPrice === null || itemPrice < minPrice) return false;
    }

    // 6. Price Max
    if (maxPrice !== null) {
      const itemPrice = parsePrice(item.price);
      if (itemPrice === null || itemPrice > maxPrice) return false;
    }

    // 7. Rooms
    if (roomsFilter !== null) {
      const itemRooms = extractRooms(item);
      if (itemRooms === null) return false;
      if (roomsFilter >= 4) {
        if (itemRooms < 4) return false;
      } else {
        if (itemRooms !== roomsFilter) return false;
      }
    }

    // 8. Furnished
    if (hasFurnishedFilter) {
      if (Boolean(item.furnished) !== expectedFurnished) return false;
    }

    return true;
  });
};
