/**
 * Local Heuristic AI-like Parser for Ouedkniss Real Estate Listings
 * Parses raw text from Ouedkniss property pages into clean structured JSON.
 * Runs offline, requires no external network requests or keys, and has 
 * advanced context heuristics to compete with LLM accuracy.
 */

// Wilayas list and mappings
const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naama", "Aïn Témouchent", "Ghardaïa", "Relizane"
];

const arabicWilayaMap = {
  "الجزائر": "Alger", "وهران": "Oran", "قسنطينة": "Constantine", "عنابة": "Annaba", "الطارف": "El Tarf",
  "البليدة": "Blida", "سطيف": "Sétif", "تيزي وزو": "Tizi Ouzou", "بجاية": "Béjaïa", "تلمسان": "Tlemcen",
  "جيجل": "Jijel", "سكيكدة": "Skikda", "باتنة": "Batna", "بسكرة": "Biskra", "مستغانم": "Mostaganem",
  "البويرة": "Bouira", "تيارت": "Tiaret", "الجلفة": "Djelfa", "الشلف": "Chlef", "سيدي بلعباس": "Sidi Bel Abbès",
  "المسيلة": "M'Sila", "معسكر": "Mascara", "ورقلة": "Ouargla", "برج بوعريريج": "Bordj Bou Arréridj",
  "بومرداس": "Boumerdès", "تيبازة": "Tipaza", "ميلة": "Mila", "عين الدفلى": "Aïn Defla", "غرداية": "Ghardaïa"
};

export function localParseListing(text, titleCandidate = '', images = []) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const fullText = text.toLowerCase();
  
  // 1. Title Extraction / Cleaning
  let title = titleCandidate;
  if (!title) {
    const categoryIndex = lines.indexOf('عقارات');
    if (categoryIndex !== -1 && lines.length > categoryIndex + 3) {
      title = lines[categoryIndex + 3];
    } else {
      title = lines[0] || 'Annonce Immobilière';
    }
  }
  // Clean Title
  title = title.replace(/\s+/g, ' ').trim();

  // 2. Category & Transaction Type
  let transactionType = 'buy'; // default
  let category = 'sell';        // default

  // Direct matches
  const locationKeywords = ['كراء', 'location', 'louer', 'loue', 'loué'];
  const saleKeywords = ['بيع', 'vente', 'vendre', 'vend'];
  const vacationKeywords = ['كراء vacances', 'location vacances', 'vacance', 'vacances', 'nuit', 'nuitee', 'يومي', 'ليلة', 'لليلة'];

  if (locationKeywords.some(kw => fullText.includes(kw))) {
    transactionType = 'rent';
  } else if (saleKeywords.some(kw => fullText.includes(kw))) {
    transactionType = 'buy';
  }

  // Check for short term / holiday rentals
  if (transactionType === 'rent') {
    const isVacation = vacationKeywords.some(kw => fullText.includes(kw));
    if (isVacation) {
      category = 'leisure';
    }
  }

  // 3. Property Type Detection
  let propertyType = 'apartment'; // fallback
  const typeMap = {
    villa: ['villa', 'فيلا', 'فلا'],
    land: ['terrain', 'terre', 'أرض', 'ارض', 'تراب'],
    commercial: ['local', 'commercial', 'magasin', 'محل', 'تجاري', 'مكتب', 'bureau', 'hangar', 'مستودع'],
    studio: ['studio', 'ستوديو', 'استوديو'],
    house: ['maison', 'منزل', 'حوش', 'دار', 'r+1', 'r+2', 'r+3'],
    apartment: ['appartement', 'appart', 'شقة', 'شقه', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'duplex', 'دوبلكس']
  };

  for (const [type, keywords] of Object.entries(typeMap)) {
    if (keywords.some(kw => fullText.includes(kw) || title.toLowerCase().includes(kw))) {
      propertyType = type;
      break;
    }
  }

  // 4. Price Parsing (The most challenging part to match LLM accuracy)
  let price = 0;
  
  // Heuristic A: Look for direct DA or دج matches
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'دج' || line === 'DA' || line === 'DZD') {
      const prevLine = lines[i - 1];
      if (prevLine && /^[0-9\s.,]+$/.test(prevLine)) {
        const cleanedVal = parseFloat(prevLine.replace(/[\s.,]+/g, ''));
        if (!isNaN(cleanedVal) && cleanedVal > 0) {
          price = cleanedVal;
          break;
        }
      }
    }
  }

  // Heuristic B: If price is not set, parse million/milliard/billion combinations in Arabic & French
  if (price === 0) {
    // Regex for: numbers followed by million/milliard words
    // E.g., "3.5 ملايين", "120 مليون", "3 ملايير", "15 Milliards", "80 Millions"
    const pattern = /(\d+(?:[.,]\d+)?)\s*(مليون|ملايين|million|millions|m|u|مليار|ملايير|milliard|milliards|md)/gi;
    let match;
    const matches = [];
    while ((match = pattern.exec(fullText)) !== null) {
      const numStr = match[1].replace(',', '.');
      const value = parseFloat(numStr);
      const unit = match[2].toLowerCase();
      if (!isNaN(value)) {
        let absoluteVal = value;
        if (unit.includes('مليار') || unit.includes('ملايير') || unit.includes('milliard') || unit.includes('md')) {
          absoluteVal = value * 1000000000;
        } else if (unit.includes('مليون') || unit.includes('ملايين') || unit.includes('million') || unit.includes('m') || unit.includes('u')) {
          absoluteVal = value * 1000000;
        }
        matches.push(absoluteVal);
      }
    }
    // Take the first valid parsed price
    if (matches.length > 0) {
      price = matches[0];
    }
  }

  // Heuristic C: Find raw standalone numbers that could be price
  if (price === 0) {
    const rawNumbers = lines
      .map(l => l.replace(/[\s.,]+/g, ''))
      .filter(l => /^\d{4,10}$/.test(l))
      .map(l => parseInt(l));
    
    // Choose reasonable values based on transaction type
    if (transactionType === 'rent' && category === 'sell') {
      // Rent monthly is usually between 10,000 and 300,000
      const rentCandidate = rawNumbers.find(n => n >= 10000 && n <= 300000);
      if (rentCandidate) price = rentCandidate;
    } else if (category === 'leisure') {
      // Vacation rent is usually 2,000 to 30,000
      const leisureCandidate = rawNumbers.find(n => n >= 2000 && n <= 50000);
      if (leisureCandidate) price = leisureCandidate;
    } else {
      // Sale is usually > 1,000,000
      const saleCandidate = rawNumbers.find(n => n >= 1000000);
      if (saleCandidate) price = saleCandidate;
    }
  }

  // 5. Price Unit
  let priceUnit = 'total';
  if (category === 'leisure') {
    priceUnit = 'per-night';
  } else if (transactionType === 'rent') {
    priceUnit = 'per-month';
  }

  // 6. Rooms count extraction
  let rooms = 1;
  if (propertyType === 'land') {
    rooms = 1;
  } else {
    // Check standard F1, F2, F3, F4, F5 patterns in text or title
    const fMatch = title.match(/\b[fF]([1-9])\b/) || fullText.match(/\b[fF]([1-9])\b/);
    if (fMatch) {
      rooms = parseInt(fMatch[1]);
    } else {
      // Check lines for room keywords
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === 'الغرف' || line === 'Pièces') {
          const next = lines[i + 1];
          if (next) {
            const match = next.match(/(\d+)/);
            if (match) {
              rooms = parseInt(match[1]);
              break;
            }
          }
        }
      }
      
      // If still 1, look for "X pièces", "X chambres", "X غرف"
      if (rooms === 1) {
        const match = fullText.match(/(\d+)\s*(chambres?|pièces?|pieces?|غرف|غرفة)/i);
        if (match) {
          rooms = parseInt(match[1]);
        }
      }
    }
  }

  // 7. Surface Area Heuristic
  let surface = 80; // default
  
  // Look for standard Superfice keyword
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'المساحة' || line === 'Superficie') {
      const next = lines[i + 1];
      if (next) {
        const match = next.match(/(\d+)/);
        if (match) {
          surface = parseInt(match[1]);
          break;
        }
      }
    }
  }

  // Standalone pattern match: "X m²", "X m2", "X متر"
  if (surface === 80) {
    const match = fullText.match(/(\d+)\s*(m²|m2|متر|متر مربع|م٢)/i);
    if (match) {
      const parsedSurf = parseInt(match[1]);
      if (parsedSurf > 10 && parsedSurf < 10000) {
        surface = parsedSurf;
      }
    }
  }

  // 8. Furnished Status
  let furnished = false;
  const furnishedKeywords = ['مفروش', 'meublé', 'meuble', 'equipé', 'equipe', 'équipé', 'meubles'];
  if (furnishedKeywords.some(kw => fullText.includes(kw))) {
    furnished = true;
  }

  // 9. Phone Number Extraction
  let phone = '';
  // Strip all whitespaces in text to match spaced phone numbers like "05 50 12 34 56"
  const collapsedText = text.replace(/\s+/g, '');
  const phoneRegex = /(05|06|07)\d{8}/g;
  const found = collapsedText.match(phoneRegex);
  if (found && found.length > 0) {
    phone = found[0];
  }

  // 10. Wilaya / City Extraction
  let city = 'Alger'; // fallback
  let cityFound = false;

  // Search Title First
  for (const w of wilayas) {
    if (title.toLowerCase().includes(w.toLowerCase())) {
      city = w;
      cityFound = true;
      break;
    }
  }
  if (!cityFound) {
    for (const [ar, fr] of Object.entries(arabicWilayaMap)) {
      if (title.includes(ar)) {
        city = fr;
        cityFound = true;
        break;
      }
    }
  }

  // Search Description / FullText if not found in title
  if (!cityFound) {
    for (const w of wilayas) {
      if (fullText.includes(w.toLowerCase())) {
        city = w;
        cityFound = true;
        break;
      }
    }
  }
  if (!cityFound) {
    for (const [ar, fr] of Object.entries(arabicWilayaMap)) {
      if (fullText.includes(ar)) {
        city = fr;
        cityFound = true;
        break;
      }
    }
  }

  // 11. Description Extraction & Cleanup
  let description = '';
  const descStartIndex = lines.findIndex(l => l === 'وصف' || l === 'Description');
  if (descStartIndex !== -1) {
    const descEndIndex = lines.findIndex((l, idx) => idx > descStartIndex && (l === 'معلومات التواصل' || l === 'إعلانات مماثلة' || l === 'توصيات'));
    const end = descEndIndex !== -1 ? descEndIndex : lines.length;
    description = lines.slice(descStartIndex + 1, end).join('\n');
  } else {
    // Fallback: take first few blocks of lines that look like description
    description = lines.filter(l => l.length > 20 && !l.includes('www.')).slice(0, 5).join('\n');
  }
  
  // Clean description
  description = description.trim().substring(0, 1000); // safety cap

  const parsedResult = {
    title,
    category,
    transactionType,
    propertyType,
    price,
    priceUnit,
    rooms,
    surface,
    furnished,
    description,
    phone,
    city,
    images
  };

  // Evaluate Listing Quality Score
  parsedResult.quality = evaluateListingQuality(parsedResult, text);

  return parsedResult;
}

// Listing Quality Evaluator
export function evaluateListingQuality(listing, rawText) {
  let score = 0;
  const reasons = [];

  // 1. Title Quality (max 15 pts)
  if (listing.title && listing.title.length >= 10) {
    score += 10;
  } else {
    reasons.push("Title too short/empty");
  }
  const typeKeywords = ['شقة', 'فيلا', 'منزل', 'أرض', 'محل', 'appartement', 'villa', 'maison', 'local', 'terrain'];
  if (typeKeywords.some(kw => listing.title.toLowerCase().includes(kw))) {
    score += 5;
  }

  // 2. Price Quality (max 25 pts)
  const isPlaceholderPrice = listing.price <= 1000 || listing.price === 123456 || listing.price === 12345678;
  if (listing.price && !isPlaceholderPrice) {
    if (listing.transactionType === 'rent' && listing.price >= 5000) {
      score += 25;
    } else if (listing.transactionType === 'buy' && listing.price >= 100000) {
      score += 25;
    } else {
      score += 10;
      reasons.push("Suspiciously low price for category");
    }
  } else {
    reasons.push("Price is placeholder (e.g. 1 DA) or empty");
  }

  // 3. Images Quality (max 20 pts)
  if (listing.images && listing.images.length > 0) {
    if (listing.images.length >= 5) {
      score += 20;
    } else if (listing.images.length >= 3) {
      score += 15;
    } else {
      score += 5;
      reasons.push("Too few images (1-2)");
    }
  } else {
    reasons.push("No images found");
  }

  // 4. Description Quality (max 25 pts)
  if (listing.description) {
    const len = listing.description.length;
    if (len > 300) {
      score += 25;
    } else if (len > 150) {
      score += 20;
    } else if (len > 50) {
      score += 10;
    } else {
      reasons.push("Description is very short");
    }
    const contactOnly = /اتصل|contactez|appel|tel|0\d{9}/gi.test(listing.description) && len < 60;
    if (contactOnly) {
      score -= 10;
      reasons.push("Description contains only contact details without info");
    }
  } else {
    reasons.push("Description is empty");
  }

  // 5. Specs Completeness (max 15 pts)
  const explicitSurface = rawText.includes('Superficie') || rawText.includes('المساحة') || / \d+\s*(m²|m2|متر|م٢)/i.test(rawText);
  if (explicitSurface && listing.surface !== 80) {
    score += 10;
  } else {
    reasons.push("No explicit surface area found (defaulted to 80)");
  }
  
  const explicitRooms = rawText.includes('الغرف') || rawText.includes('Pièces') || /\b[fF]([1-9])\b/.test(rawText) || /\b([1-9])\s*(غرف|غرفة|pièces|chambres)/i.test(rawText);
  if (explicitRooms) {
    score += 5;
  } else {
    reasons.push("No explicit rooms count found");
  }

  return {
    score: Math.max(0, score),
    reasons,
    isHighQuality: score >= 50
  };
}
