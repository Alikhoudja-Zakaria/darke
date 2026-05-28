import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const firebaseConfig = {
  apiKey: "AIzaSyA2BIvH0HTFJ4clvx5aQ1tinfcg34YIChI",
  authDomain: "studio-1088250814-d2038.firebaseapp.com",
  projectId: "studio-1088250814-d2038",
  storageBucket: "studio-1088250814-d2038.firebasestorage.app",
  messagingSenderId: "545622549899",
  appId: "1:545622549899:web:cdcf26ecd9f3212e90bb8e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BOT_USER_ID = "XsU0w8gUmzW6UkCP31Cii5P1Q5U2";

// Initialize Gemini AI
let ai = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  console.log("Gemini AI API Key found. AI-powered parsing is enabled!");
} else {
  console.log("No Gemini AI API Key found. Falling back to robust regex parsing.");
}


// Wilaya lists and mappings
const wilayasList = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
  "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda",
  "Skikda", "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem", "M'Sila", "Mascara", "Ouargla",
  "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naama", "Aïn Témouchent", "Ghardaïa", "Relizane"
];

const arabicWilayas = {
  "الجزائر": "Alger", "وهران": "Oran", "قسنطينة": "Constantine", "عنابة": "Annaba", "الطارف": "El Tarf",
  "البليدة": "Blida", "سطيف": "Sétif", "تيزي وزو": "Tizi Ouzou", "بجاية": "Béjaïa", "تلمسان": "Tlemcen",
  "جيجل": "Jijel", "سكيكدة": "Skikda", "باتنة": "Batna", "بسكرة": "Biskra", "مستغانم": "Mostaganem",
  "البويرة": "Bouira", "تيارت": "Tiaret", "الجلفة": "Djelfa", "الشلف": "Chlef", "سيدي بلعباس": "Sidi Bel Abbès",
  "المسيلة": "M'Sila", "معسكر": "Mascara", "ورقلة": "Ouargla", "برج بوعريريج": "Bordj Bou Arréridj",
  "بومرداس": "Boumerdès", "تيبازة": "Tipaza", "ميلة": "Mila", "عين الدفلى": "Aïn Defla", "غرداية": "Ghardaïa"
};

// Check if listing already exists in Firestore
async function checkIfListingExists(ouedknissId) {
  try {
    const q = query(collection(db, 'listings'), where('ouedknissId', '==', ouedknissId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking duplicate for ID ${ouedknissId}:`, error);
    return false;
  }
}

// Save listing to Firestore
async function saveToFirestore(listingData) {
  try {
    const docRef = await addDoc(collection(db, 'listings'), {
      ...listingData,
      createdAt: serverTimestamp(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error saving listing to Firestore:", error);
    throw error;
  }
}

// Parse page text using Gemini AI
async function parseListingTextWithAI(text, titleCandidate) {
  if (!ai) {
    return parseListingText(text, titleCandidate);
  }

  try {
    const prompt = `
You are an expert real estate data parser for the Algerian market.
Analyze the following raw text from a property listing on Ouedkniss.com, and extract the structured information in JSON format.

Raw Text:
"""
${text}
"""

Title candidate: "${titleCandidate}"

Extract and output ONLY a valid JSON object matching the following structure (no markdown formatting, no other text):
{
  "title": "string (the main title, in French or Arabic, or cleaned title candidate)",
  "category": "string (either 'sell' or 'leisure'. Set 'leisure' ONLY if it's a short-term/vacation rental, otherwise 'sell')",
  "transactionType": "string (either 'rent' for Location/Rent or 'buy' for Vente/Buy)",
  "propertyType": "string (must be one of: 'apartment', 'house', 'villa', 'studio', 'commercial', 'land')",
  "price": number (the price in DZD/DA, e.g. 7000 for 7000 DA, 13500000 for 13.5 Million, 38000000 for 3.8 Billion/Milliard. Convert millions and milliards to absolute DA numbers)",
  "priceUnit": "string (must be one of: 'per-month' for long term rentals, 'total' for sales, 'per-night' for vacation/leisure rentals)",
  "rooms": number (number of rooms, default to 1 if not specified or land),
  "surface": number (surface area in m², default to 80 if not specified),
  "furnished": boolean (true if it's furnished or has 'مفروش' or 'Meublé', otherwise false),
  "description": "string (the main description text of the listing)",
  "phone": "string (extract a 10 digit Algerian mobile number starting with 05, 06, or 07, stripped of spaces, e.g. '0652329227')",
  "city": "string (match the location to one of these exact Algerian wilaya names: 'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naama', 'Aïn Témouchent', 'Ghardaïa', 'Relizane')"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsedJson = JSON.parse(response.text.trim());
    return parsedJson;
  } catch (error) {
    console.error("AI parsing failed, falling back to regex:", error.message);
    return parseListingText(text, titleCandidate);
  }
}

// Parse page text to extract specs
function parseListingText(text, titleCandidate) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let title = titleCandidate;
  let category = 'sell';
  let transactionType = 'rent';
  let price = 0;
  let priceUnit = 'total';
  let rooms = 1;
  let surface = 80;
  let furnished = false;
  let description = '';
  let phone = '';
  let city = 'Alger';
  let propertyType = 'apartment';

  const fullText = text.toLowerCase();

  // Category and Transaction Type
  if (lines.includes('كراء') || lines.includes('Location')) {
    transactionType = 'rent';
    category = 'sell';
  } else if (lines.includes('بيع') || lines.includes('Vente')) {
    transactionType = 'buy';
    category = 'sell';
  } else if (lines.includes('كراء vacances') || lines.includes('Location vacances')) {
    transactionType = 'rent';
    category = 'leisure';
  }

  const leisureKeywords = ['nuit', 'nuitee', 'vacance', 'vacances', 'jour', 'يومي', 'ليلة', 'لليلة', 'جوان', 'جويلية', 'اوت', 'شبه', 'حجز', 'reservation', 'reserver'];
  if (transactionType === 'rent' && leisureKeywords.some(kw => fullText.includes(kw))) {
    category = 'leisure';
  }

  // Set default price units
  if (category === 'leisure') {
    priceUnit = 'per-night';
  } else if (transactionType === 'rent') {
    priceUnit = 'per-month';
  } else {
    priceUnit = 'total';
  }

  // Property Type mapping
  if (fullText.includes('شقة') || fullText.includes('appartement')) {
    propertyType = 'apartment';
  } else if (fullText.includes('فيلا') || fullText.includes('villa')) {
    propertyType = 'villa';
  } else if (fullText.includes('منزل') || fullText.includes('maison') || fullText.includes('حوش')) {
    propertyType = 'house';
  } else if (fullText.includes('استوديو') || fullText.includes('studio')) {
    propertyType = 'studio';
  } else if (fullText.includes('أرض') || fullText.includes('terrain') || fullText.includes('تراب')) {
    propertyType = 'land';
  } else if (fullText.includes('محل') || fullText.includes('local') || fullText.includes('تجاري') || fullText.includes('commercial')) {
    propertyType = 'commercial';
  }

  // Price parsing
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'دج' || line === 'DA') {
      const prevLine = lines[i - 1];
      if (prevLine && /^[0-9\s]+$/.test(prevLine)) {
        price = parseFloat(prevLine.replace(/\s+/g, ''));
        break;
      }
    } else if (line.includes('مليار') || line.includes('Billion')) {
      let val = 0;
      if (line === 'مليار' || line === 'Billion') {
        val = parseFloat(lines[i - 1]);
      } else {
        val = parseFloat(line.replace(/مليار|Billion/g, '').trim());
      }
      if (!isNaN(val)) {
        price = val * 1000000000;
        break;
      }
    } else if (line.includes('مليون') || line.includes('Million')) {
      let val = 0;
      if (line === 'مليون' || line === 'Million') {
        val = parseFloat(lines[i - 1]);
      } else {
        val = parseFloat(line.replace(/مليون|Million/g, '').trim());
      }
      if (!isNaN(val)) {
        price = val * 1000000;
        break;
      }
    }
  }

  // Specs parsing
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === 'الغرف' || line === 'Pièces') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const match = nextLine.match(/(\d+)/);
        if (match) rooms = parseInt(match[1]);
      }
    }
    if (line === 'المساحة' || line === 'Superficie') {
      const nextLine = lines[i + 1];
      if (nextLine) {
        const match = nextLine.match(/(\d+)/);
        if (match) surface = parseInt(match[1]);
      }
    }
    if (line.includes('مفروش') || line.includes('Meublé')) {
      furnished = true;
    }
  }

  // Description parsing
  const descStartIndex = lines.findIndex(l => l === 'وصف' || l === 'Description');
  if (descStartIndex !== -1) {
    const descEndIndex = lines.findIndex((l, idx) => idx > descStartIndex && (l === 'معلومات التواصل' || l === 'إعلانات مماثلة' || l === 'توصيات'));
    const end = descEndIndex !== -1 ? descEndIndex : lines.length;
    description = lines.slice(descStartIndex + 1, end).join('\n');
  }

  // Phone parsing
  const cleanedText = text.replace(/\s+/g, '');
  const phoneRegex = /(05|06|07)\d{8}/g;
  const foundPhones = cleanedText.match(phoneRegex);
  if (foundPhones && foundPhones.length > 0) {
    phone = foundPhones[0];
  }

  // Wilaya matching
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
    propertyType,
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

async function scrape() {
  const isDryRun = process.argv.includes('--dry-run');
  
  // Parse starting page (default to 1)
  let startPage = 1;
  const startPageIdx = process.argv.indexOf('--start-page');
  if (startPageIdx !== -1 && process.argv[startPageIdx + 1]) {
    startPage = parseInt(process.argv[startPageIdx + 1]) || 1;
  }
  
  // Parse target count
  let targetCount = isDryRun ? 3 : 90;
  const targetIdx = process.argv.indexOf('--target');
  if (targetIdx !== -1 && process.argv[targetIdx + 1]) {
    targetCount = parseInt(process.argv[targetIdx + 1]) || targetCount;
  }
  
  console.log(`Starting scraper in ${isDryRun ? 'DRY-RUN' : 'PRODUCTION'} mode. startPage: ${startPage}, target: ${targetCount}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');

  const listingUrls = new Set();
  let pageNum = startPage;
  let consecutiveDuplicates = 0;
  const EARLY_EXIT_THRESHOLD = 8; // Stop if we hit 8 consecutive duplicates

  // Step 1: Collect listing URLs
  console.log('--- Collecting Listing URLs ---');
  while (listingUrls.size < targetCount && pageNum <= 100) {
    const listUrl = `https://www.ouedkniss.com/immobilier/${pageNum}`;
    console.log(`Loading list page ${pageNum}: ${listUrl}`);
    try {
      await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      
      // Scroll to trigger infinite scroll loads
      for (let i = 0; i < 4; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const hrefs = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors.map(a => a.href).filter(href => href && href.includes('-d') && href.match(/-d\d+$/));
      });

      let pageNewListingsCount = 0;
      for (const href of hrefs) {
        if (listingUrls.size >= targetCount) {
          break;
        }

        const match = href.match(/-d(\d+)$/);
        if (!match) continue;
        const ouedknissId = match[1];

        // Skip in-memory duplicates
        if (listingUrls.has(href)) continue;

        // Check if duplicate in Firestore
        let exists = false;
        if (!isDryRun) {
          exists = await checkIfListingExists(ouedknissId);
        }

        if (exists) {
          consecutiveDuplicates++;
          console.log(`URL ${href} (ID: ${ouedknissId}) already exists in Firestore. Streak count: ${consecutiveDuplicates}`);
          if (consecutiveDuplicates >= EARLY_EXIT_THRESHOLD) {
            console.log(`Hit early exit threshold of ${EARLY_EXIT_THRESHOLD} consecutive duplicates. Stopping URL collection.`);
            break;
          }
        } else {
          consecutiveDuplicates = 0; // Reset streak
          listingUrls.add(href);
          pageNewListingsCount++;
        }
      }

      console.log(`Page ${pageNum} yielded ${pageNewListingsCount} new listings. Total collected: ${listingUrls.size}/${targetCount}`);

      if (consecutiveDuplicates >= EARLY_EXIT_THRESHOLD) {
        break; // Break the outer while loop
      }

      pageNum++;
    } catch (err) {
      console.error(`Error loading page ${pageNum}:`, err.message);
      break;
    }
  }


  const urlsArray = Array.from(listingUrls);
  console.log(`Total candidate URLs collected: ${urlsArray.length}`);

  let successCount = 0;

  // Step 2: Process details for each URL
  console.log('--- Processing Details ---');
  for (let i = 0; i < urlsArray.length; i++) {
    if (successCount >= targetCount) {
      console.log(`Reached target count of ${targetCount} successfully imported listings.`);
      break;
    }

    const detailUrl = urlsArray[i];
    const match = detailUrl.match(/-d(\d+)$/);
    if (!match) continue;
    const ouedknissId = match[1];

    console.log(`[${i + 1}/${urlsArray.length}] Processing Ouedkniss ID ${ouedknissId}...`);

    // Check duplicate (double check)
    if (!isDryRun) {
      const exists = await checkIfListingExists(ouedknissId);
      if (exists) {
        console.log(`Listing ${ouedknissId} already exists in Firestore. Skipping.`);
        continue;
      }
    }

    let detailPage = null;
    try {
      detailPage = await browser.newPage();
      await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
      
      await detailPage.goto(detailUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Extract listing title candidate
      const titleCandidate = await detailPage.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.innerText.trim() : '';
      });

      // Extract images (filter out icons and trackers)
      const images = await detailPage.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs
          .map(img => img.src)
          .filter(src => src && src.includes('medias/announcements/images/'));
      });

      // Click contact button
      const clicked = await detailPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const contactBtn = buttons.find(b => b.innerText.includes('إتصال') || b.innerText.includes('Contact') || b.innerText.includes('Appeler') || b.className.includes('bg-blue-darken-2'));
        if (contactBtn) {
          contactBtn.click();
          return true;
        }
        return false;
      });

      if (clicked) {
        // Wait for phone number modal
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      const bodyText = await detailPage.evaluate(() => document.body.innerText);

      const parsed = await parseListingTextWithAI(bodyText, titleCandidate);
      parsed.images = images;
      parsed.ouedknissId = ouedknissId;
      parsed.userId = BOT_USER_ID;

      // Validation
      if (!parsed.title) {
        console.log('Skipping: Title is empty.');
        continue;
      }
      if (!parsed.phone) {
        console.log('Skipping: Phone number is empty.');
        continue;
      }
      if (parsed.price <= 0) {
        console.log('Skipping: Price is invalid/empty.');
        continue;
      }
      if (!parsed.images || parsed.images.length === 0) {
        console.log('Skipping: No images found.');
        continue;
      }
      if (!parsed.description || parsed.description.length < 10) {
        console.log('Skipping: Description is empty or too short.');
        continue;
      }

      console.log('Parsed Listing Data:', {
        ...parsed,
        description: parsed.description.substring(0, 50) + '...',
        imagesCount: parsed.images.length
      });

      if (isDryRun) {
        successCount++;
        console.log('Dry-run success. Not writing to Firestore.');
      } else {
        const docId = await saveToFirestore(parsed);
        successCount++;
        console.log(`Successfully saved listing to Firestore. Document ID: ${docId}`);
      }

      // Small delay between requests to be gentle
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (err) {
      console.error(`Error processing listing ${detailUrl}:`, err.message);
    } finally {
      if (detailPage) {
        try {
          await detailPage.close();
        } catch (e) {}
      }
    }
  }

  console.log(`Scraping complete. Successfully processed: ${successCount} listings.`);
  try {
    await browser.close();
  } catch (err) {
    console.log('Browser closed with minor cleanup warning:', err.message);
  }
  process.exit(0);
}

scrape();
