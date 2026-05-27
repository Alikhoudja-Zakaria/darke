import fs from 'fs';
import path from 'path';

function parseListingText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let title = '';
  let category = 'sell';
  let transactionType = 'rent';
  let price = 0;
  let priceUnit = 'total';
  let rooms = 1;
  let surface = 80; // default fallback
  let furnished = false;
  let description = '';
  let phone = '';
  let city = 'Alger'; // default fallback

  // Let's find category (كراء or بيع or شراء)
  // كراء is renting, بيع is selling
  if (lines.includes('كراء')) {
    transactionType = 'rent';
    category = 'sell'; // default to sell for long-term renting unless it's leisure
  } else if (lines.includes('بيع')) {
    transactionType = 'buy';
    category = 'sell';
  } else if (lines.includes('كراء vacances') || lines.includes('Location vacances')) {
    transactionType = 'rent';
    category = 'leisure';
  }

  // If rent, check if description has keywords for vacation/short term
  const leisureKeywords = ['nuit', 'nuitee', 'vacance', 'vacances', 'jour', 'يومي', 'ليلة', 'لليلة', 'جوان', 'جويلية', 'اوت', 'شبه', 'حجز', 'reservation', 'reserver'];
  const fullText = text.toLowerCase();
  if (transactionType === 'rent' && leisureKeywords.some(kw => fullText.includes(kw))) {
    category = 'leisure';
  }

  // Let's find title
  // In Ouedkniss, the title is usually after categories in the breadcrumbs.
  // E.g. "عقارات \n كراء \n شقة \n كراء شقة دوبلكس 4 غرف الطارف القالة"
  // Let's look for the line containing the category path or the first line that looks like the title
  // In our listing_text.txt, lines[0]='عقارات', lines[1]='كراء', lines[2]='شقة', lines[3]='كراء شقة دوبلكس 4 غرف الطارف القالة'
  const categoryIndex = lines.indexOf('عقارات');
  if (categoryIndex !== -1 && lines.length > categoryIndex + 3) {
    title = lines[categoryIndex + 3];
  } else {
    title = lines[0] || 'Annonce Immobilière';
  }

  // Price parsing
  // Look for a line containing 'دج' or 'DA' or 'مليار' or 'مليون'
  // In listing_text.txt, we have lines:
  // "7 000"
  // "دج"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'دج' || line === 'DA') {
      const prevLine = lines[i - 1];
      if (prevLine && /^[0-9\s]+$/.test(prevLine)) {
        price = parseFloat(prevLine.replace(/\s+/g, ''));
        break;
      }
    } else if (line.includes('مليار')) {
      // e.g. "3.80 \n مليار" or "3.80 مليار"
      let val = 0;
      if (line === 'مليار') {
        val = parseFloat(lines[i - 1]);
      } else {
        val = parseFloat(line.replace('مليار', '').trim());
      }
      if (!isNaN(val)) {
        price = val * 1000000000;
        break;
      }
    } else if (line.includes('مليون')) {
      let val = 0;
      if (line === 'مليون') {
        val = parseFloat(lines[i - 1]);
      } else {
        val = parseFloat(line.replace('مليون', '').trim());
      }
      if (!isNaN(val)) {
        price = val * 1000000;
        break;
      }
    }
  }

  // Set price unit
  if (category === 'leisure') {
    priceUnit = 'per-night';
  } else if (transactionType === 'rent') {
    priceUnit = 'per-month';
  } else {
    priceUnit = 'total';
  }

  // Specs parsing (rooms, surface, furnished)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'الغرف') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const match = nextLine.match(/(\d+)/);
        if (match) rooms = parseInt(match[1]);
      }
    }
    if (line === 'المساحة' || line.includes('Superficie')) {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const match = nextLine.match(/(\d+)/);
        if (match) surface = parseInt(match[1]);
      }
    }
    if (line === 'مفروش' || line === 'Meublé' || line.includes('مفروش') || line.includes('Meublé')) {
      furnished = true;
    }
  }

  // Description parsing
  // Extract text after 'وصف' or 'Description' up to 'معلومات التواصل' or 'إعلانات مماثلة'
  const descStartIndex = lines.findIndex(l => l === 'وصف' || l === 'Description');
  if (descStartIndex !== -1) {
    const descEndIndex = lines.findIndex((l, idx) => idx > descStartIndex && (l === 'معلومات التواصل' || l === 'إعلانات مماثلة' || l === 'توصيات'));
    const end = descEndIndex !== -1 ? descEndIndex : lines.length;
    description = lines.slice(descStartIndex + 1, end).join('\n');
  }

  // Phone parsing
  // Clean all spaces and look for 05, 06, 07 phone numbers
  const cleanedText = text.replace(/\s+/g, '');
  const phoneRegex = /(05|06|07)\d{8}/g;
  const foundPhones = cleanedText.match(phoneRegex);
  if (foundPhones && foundPhones.length > 0) {
    phone = foundPhones[0];
  }

  // City / Wilaya matching
  // Try to find any wilaya name in the title or text
  const wilayasList = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
    "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
    "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
    "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
    "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naama", "Aïn Témouchent", "Ghardaïa", "Relizane"
  ];
  
  // Mapping Arabic wilaya names to French names
  const arabicWilayas = {
    "الجزائر": "Alger", "وهران": "Oran", "قسنطينة": "Constantine", "عنابة": "Annaba", "الطارف": "El Tarf",
    "البليدة": "Blida", "سطيف": "Sétif", "تيزي وزو": "Tizi Ouzou", "بجاية": "Béjaïa", "تلمسان": "Tlemcen",
    "جيجل": "Jijel", "سكيكدة": "Skikda", "باتنة": "Batna", "بسكرة": "Biskra", "مستغانم": "Mostaganem",
    "البويرة": "Bouira", "تيارت": "Tiaret", "الجلفة": "Djelfa", "الشلف": "Chlef", "سيدي بلعباس": "Sidi Bel Abbès",
    "المسيلة": "M'Sila", "معسكر": "Mascara", "ورقلة": "Ouargla", "برج بوعريريج": "Bordj Bou Arréridj",
    "بومرداس": "Boumerdès", "تيبازة": "Tipaza", "ميلة": "Mila", "عين الدفلى": "Aïn Defla", "غرداية": "Ghardaïa"
  };

  for (const w of wilayasList) {
    if (fullText.includes(w.toLowerCase())) {
      city = w;
      break;
    }
  }

  for (const [ar, fr] of Object.entries(arabicWilayas)) {
    if (fullText.includes(ar)) {
      city = fr;
      break;
    }
  }

  return {
    title,
    category,
    transactionType,
    price,
    priceUnit,
    rooms,
    surface,
    furnished,
    description,
    phone,
    city
  };
}

const dir = 'C:\\Users\\surface laptop 4\\.gemini\\antigravity\\brain\\2505d6ea-1a51-4fdf-bebb-c5f94ed29e29\\scratch';
const text = fs.readFileSync(path.join(dir, 'listing_text_after_click.txt'), 'utf8');
const result = parseListingText(text);
console.log('Parsed Result:', result);
