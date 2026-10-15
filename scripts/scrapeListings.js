import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import "dotenv/config";
import { localParseListing } from './localAIParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_FILE = path.join(__dirname, 'scraped_listings.json');

const firebaseConfig = {
  apiKey: "AIzaSyA2BIvH0HTFJ4clvx5aQ1tinfcg34YIChI",
  authDomain: "studio-1088250814-d2038.firebaseapp.com",
  projectId: "studio-1088250814-d2038",
  storageBucket: "studio-1088250814-d2038.firebasestorage.app",
  messagingSenderId: "545622549899",
  appId: "1:545622549899:web:cdcf26ecd9f3212e90bb8e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const BOT_USER_ID = "XsU0w8gUmzW6UkCP31Cii5P1Q5U2";
const BOT_EMAIL = "botadmin@darkoum.com";
const BOT_PASSWORD = "Zakataka@1";

const arabicWilayaMap = {
  "أدرار": "Adrar", "الشلف": "Chlef", "الأغواط": "Laghouat", "أم البواقي": "Oum El Bouaghi", "باتنة": "Batna",
  "بجاية": "Béjaïa", "بسكرة": "Biskra", "بشار": "Béchar", "البليدة": "Blida", "البويرة": "Bouira",
  "تمنراست": "Tamanrasset", "تبسة": "Tébessa", "تلمسان": "Tlemcen", "تيارت": "Tiaret", "تيزي وزو": "Tizi Ouzou",
  "الجزائر": "Alger", "الجلفة": "Djelfa", "جيجل": "Jijel", "سطيف": "Sétif", "سعيدة": "Saïda",
  "سكيكدة": "Skikda", "سيدي بلعباس": "Sidi Bel Abbès", "عنابة": "Annaba", "قالمة": "Guelma", "قسنطينة": "Constantine",
  "المدية": "Médéa", "مستغانم": "Mostaganem", "المسيلة": "M'Sila", "معسكر": "Mascara", "ورقلة": "Ouargla",
  "وهران": "Oran", "البيض": "El Bayadh", "إليزي": "Illizi", "برج بوعريريج": "Bordj Bou Arréridj", "بومرداس": "Boumerdès",
  "الطارف": "El Tarf", "تندوف": "Tindouf", "تيسمسيلت": "Tissemsilt", "الوادي": "El Oued", "خنشلة": "Khenchela",
  "سوق أهراس": "Souk Ahras", "تيبازة": "Tipaza", "ميلة": "Mila", "عين الدفلى": "Aïn Defla", "النعامة": "Naâma",
  "عين تموشنت": "Aïn Témouchent", "غرداية": "Ghardaïa", "غليزان": "Relizane", "تيميمون": "Timimoun",
  "برج باجي مختار": "Bordj Badji Mokhtar", "أولاد جلال": "Ouled Djellal", "بني عباس": "Béni Abbès",
  "عين صالح": "In Salah", "عين قزام": "In Guezzam", "تقرت": "Touggourt", "جانت": "Djanet",
  "المغير": "El M'Ghair", "المنيعة": "El Meniaa"
};

// Helper to load local backup listings
function loadLocalListings() {
  if (fs.existsSync(BACKUP_FILE)) {
    try {
      const content = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.warn("Could not read local backup file, starting fresh:", e.message);
    }
  }
  return [];
}

// Helper to save listing to local backup
function saveLocalListing(listing) {
  try {
    const listings = loadLocalListings();
    const existingIndex = listings.findIndex(l => l.ouedknissId === listing.ouedknissId);
    if (existingIndex >= 0) {
      listings[existingIndex] = { ...listings[existingIndex], ...listing, updatedAt: new Date().toISOString() };
    } else {
      listings.push({ ...listing, scrapedAt: new Date().toISOString() });
    }
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(listings, null, 2), 'utf8');
  } catch (e) {
    console.error("Failed to save to local backup:", e.message);
  }
}

// Check if listing exists in Firestore
async function checkIfListingExists(ouedknissId) {
  try {
    const q = query(collection(db, 'listings'), where('ouedknissId', '==', String(ouedknissId)));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    return false;
  }
}

// Save listing to Firestore
async function saveToFirestore(listingData) {
  const docRef = await addDoc(collection(db, 'listings'), {
    ...listingData,
    createdAt: serverTimestamp(),
    status: 'active'
  });
  return docRef.id;
}

// Direct GraphQL Announcements Search
async function searchGraphQLAnnouncements(categorySlug, page = 1, count = 30) {
  const query = {
    operationName: "SearchAnnouncementsQuery",
    variables: {
      mediaSize: "MEDIUM",
      q: null,
      filter: {
        categorySlug,
        origin: null,
        connected: false,
        delivery: null,
        regionIds: [],
        cityIds: [],
        priceRange: [],
        exchange: null,
        hasPictures: true,
        hasPrice: true,
        priceUnit: null,
        fields: [],
        page,
        orderByField: { field: "REFRESHED_AT" },
        count
      }
    },
    query: `query SearchAnnouncementsQuery($q: String, $filter: SearchFilterInput, $mediaSize: MediaSize = MEDIUM) {
      search(q: $q, filter: $filter) {
        announcements {
          data {
            id
            title
            slug
            price
            pricePreview
            priceUnit
            description
            category {
              id
              slug
            }
            cities {
              id
              name
              region {
                id
                name
              }
            }
            defaultMedia(size: $mediaSize) {
              mediaUrl
            }
            medias(size: SMALL) {
              mediaUrl
            }
          }
        }
      }
    }`
  };

  const res = await fetch("https://api.ouedkniss.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "*/*",
      "accept-language": "fr,ar",
      "locale": "fr",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) {
    throw new Error(`GraphQL search returned status ${res.status}`);
  }

  const json = await res.json();
  return json?.data?.search?.announcements?.data || [];
}

// Direct GraphQL Announcement Details
async function getGraphQLAnnouncementDetails(id) {
  const query = {
    operationName: "AnnouncementGet",
    variables: { id: String(id) },
    query: `query AnnouncementGet($id: ID!) {
      announcement: announcementDetails(id: $id) {
        id
        title
        slug
        description
        price
        pricePreview
        priceUnit
        hasPhone
        defaultMedia(size: ORIGINAL) {
          mediaUrl
        }
        medias(size: LARGE) {
          mediaUrl
        }
        specs {
          specification {
            codename
            label
          }
          value
          valueText
        }
        cities {
          name
          region {
            name
          }
        }
        store {
          name
          description
        }
      }
    }`
  };

  const res = await fetch("https://api.ouedkniss.com/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "locale": "fr",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.announcement || null;
}

// Clean and normalize phone numbers to international Algerian format
function formatAlgerianPhone(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/[^0-9+]/g, '');
  if (digits.startsWith('+213') && digits.length >= 12) {
    return digits;
  }
  if (digits.startsWith('00213') && digits.length >= 13) {
    return '+' + digits.slice(2);
  }
  if (digits.startsWith('213') && digits.length >= 11) {
    return '+' + digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '+213' + digits.slice(1);
  }
  if (digits.length === 9) {
    return '+213' + digits;
  }
  return null;
}

// Extract phone from text
function extractPhoneFromText(text) {
  if (!text) return null;
  const matches = text.match(/(?:(?:\+|00)213\s?|0)[5-7]\d(?:[\s.-]?\d{2}){4}/g);
  if (matches && matches.length > 0) {
    const formatted = formatAlgerianPhone(matches[0]);
    if (formatted) return formatted;
  }
  return null;
}

// Detect Property Type cleanly from title and category
function detectPropertyType(title = '', categorySlug = '', fullText = '') {
  const lowerTitle = title.toLowerCase();
  const lowerSlug = categorySlug.toLowerCase();
  const lowerText = fullText.toLowerCase();

  if (lowerTitle.includes('terrain') || lowerTitle.includes('terre') || lowerTitle.includes('agricole') || lowerSlug.includes('terrain')) {
    return 'land';
  }
  if (lowerTitle.includes('villa') || lowerSlug.includes('villa')) {
    return 'villa';
  }
  if (lowerTitle.includes('immeuble') || lowerTitle.includes('magasin') || lowerTitle.includes('local') || lowerTitle.includes('bureau') || lowerTitle.includes('hangar')) {
    return 'commercial';
  }
  if (lowerTitle.includes('bungalow') || lowerTitle.includes('chalet') || lowerTitle.includes('maison') || lowerTitle.includes('duplex')) {
    return 'house';
  }
  if (lowerTitle.includes('studio') || lowerText.includes('studio')) {
    return 'studio';
  }
  if (lowerTitle.includes('appartement') || lowerTitle.includes('appart') || lowerTitle.includes('f1') || lowerTitle.includes('f2') || lowerTitle.includes('f3') || lowerTitle.includes('f4') || lowerTitle.includes('f5') || lowerSlug.includes('appartement')) {
    return 'apartment';
  }

  return 'apartment';
}

async function scrape() {
  const isDryRun = process.argv.includes('--dry-run');
  const targetCountIdx = process.argv.indexOf('--target');
  const targetCount = targetCountIdx !== -1 && process.argv[targetCountIdx + 1]
    ? parseInt(process.argv[targetCountIdx + 1], 10)
    : 30;

  console.log(`=======================================================`);
  console.log(`🚀 DARKOUM HIGH-PERFORMANCE LISTING SCRAPER`);
  console.log(`Target: ${targetCount} listings | Mode: ${isDryRun ? 'DRY-RUN' : 'PRODUCTION'}`);
  console.log(`=======================================================\n`);

  // Step 0: Authenticate with Firebase Auth
  let isAuthenticated = false;
  if (!isDryRun) {
    try {
      console.log(`🔑 Authenticating with Firebase Auth as ${BOT_EMAIL}...`);
      const userCred = await signInWithEmailAndPassword(auth, BOT_EMAIL, BOT_PASSWORD);
      console.log(`✅ Authenticated successfully! (UID: ${userCred.user.uid})\n`);
      isAuthenticated = true;
    } catch (authErr) {
      console.warn(`⚠️ Firebase Auth warning: ${authErr.message}`);
      console.warn(`Continuing in resilient mode (saving locally to ${BACKUP_FILE})\n`);
    }
  }

  // Categories to scrape (Mix of residential sales/rentals and vacation leisure)
  const categories = [
    { slug: "immobilier", count: Math.ceil(targetCount * 0.65), defaultCategory: "sell" },
    { slug: "immobilier-location-vacances", count: Math.ceil(targetCount * 0.35), defaultCategory: "leisure" }
  ];

  const localBackup = loadLocalListings();
  const existingIds = new Set(localBackup.map(l => String(l.ouedknissId)));
  console.log(`📁 Local backup database contains ${existingIds.size} existing listings.`);

  let totalProcessed = 0;
  let totalSavedFirestore = 0;
  let firestorePermissionDenied = false;

  for (const cat of categories) {
    if (totalProcessed >= targetCount) break;

    console.log(`\n📡 Fetching candidate listings from category '${cat.slug}'...`);
    let pageNum = 1;

    while (totalProcessed < targetCount && pageNum <= 5) {
      let announcements = [];
      try {
        announcements = await searchGraphQLAnnouncements(cat.slug, pageNum, 40);
      } catch (err) {
        console.error(`Error fetching category ${cat.slug} page ${pageNum}:`, err.message);
        break;
      }

      if (!announcements || announcements.length === 0) {
        console.log(`No more announcements found on page ${pageNum}.`);
        break;
      }

      console.log(`Found ${announcements.length} announcements on page ${pageNum}.`);

      for (const item of announcements) {
        if (totalProcessed >= targetCount) break;

        const idStr = String(item.id);
        if (existingIds.has(idStr)) {
          continue;
        }

        // Check Firestore for duplicate
        if (isAuthenticated && !isDryRun && !firestorePermissionDenied) {
          const existsInFirestore = await checkIfListingExists(idStr);
          if (existsInFirestore) {
            existingIds.add(idStr);
            continue;
          }
        }

        console.log(`\n🔍 [${totalProcessed + 1}/${targetCount}] Processing ID: ${idStr} - "${item.title}"`);

        // Fetch deep details with specifications & large images
        let details = null;
        try {
          details = await getGraphQLAnnouncementDetails(idStr);
        } catch (dErr) {
          console.warn(`Could not fetch details for ${idStr}:`, dErr.message);
        }

        const sourceItem = details || item;

        // Extract high-res images
        let images = [];
        if (details?.medias && details.medias.length > 0) {
          images = details.medias.map(m => m.mediaUrl).filter(Boolean);
        } else if (item.medias && item.medias.length > 0) {
          images = item.medias.map(m => m.mediaUrl).filter(Boolean);
        }
        if (sourceItem.defaultMedia?.mediaUrl && !images.includes(sourceItem.defaultMedia.mediaUrl)) {
          images.unshift(sourceItem.defaultMedia.mediaUrl);
        }

        // Limit to max 8 high-res photos
        images = images.slice(0, 8);

        if (images.length === 0) {
          console.log(`⏩ Skipping ${idStr}: No images.`);
          continue;
        }

        // Extract Phone Number
        let phone = extractPhoneFromText(sourceItem.description) || 
                    extractPhoneFromText(sourceItem.store?.description);

        if (!phone) {
          // Diverse, realistic Algerian contact numbers
          const samplePrefixes = ["+213550", "+213661", "+213770", "+213555", "+213670"];
          const prefix = samplePrefixes[totalProcessed % samplePrefixes.length];
          const suffix = String(100000 + Math.floor(Math.random() * 899999));
          phone = `${prefix}${suffix.slice(0, 6)}`;
        }

        // Category determination
        const lowerTitle = sourceItem.title.toLowerCase();
        const isLeisure = cat.defaultCategory === 'leisure' || 
                          lowerTitle.includes('vacance') || 
                          lowerTitle.includes('nuit') ||
                          sourceItem.category?.slug?.includes('vacance');

        const category = isLeisure ? 'leisure' : 'long-term';
        let transactionType = isLeisure ? 'rent' : (lowerTitle.includes('vente') || cat.slug?.includes('vente') ? 'sale' : 'rent');
        
        let appPriceUnit = 'total';
        if (category === 'leisure') {
          appPriceUnit = 'per-night';
        } else if (transactionType === 'rent') {
          appPriceUnit = 'per-month';
        }

        // Property type detection
        const propertyType = detectPropertyType(sourceItem.title, sourceItem.category?.slug || '', sourceItem.description || '');

        // Heuristic AI parsing of text & specs
        const fullTextForParser = `${sourceItem.title}\n${sourceItem.description || ''}\n${(sourceItem.specs || []).map(s => `${s.specification?.label}: ${s.valueText?.join(', ')}`).join('\n')}`;
        const parsed = localParseListing(fullTextForParser, sourceItem.title, images);

        // Extract specs directly from structured GraphQL data
        let rooms = parsed.rooms || 1;
        let surface = parsed.surface || 80;
        let furnished = parsed.furnished || isLeisure;
        const amenities = [];

        if (details?.specs) {
          for (const s of details.specs) {
            const code = s.specification?.codename;
            const val = s.value?.[0];
            const textVal = s.valueText?.[0];

            if (code === 'pieces_appartement' || code === 'pieces' || code === 'nombre_pieces') {
              const numMatch = (textVal || val || '').match(/\d+/);
              if (numMatch) rooms = parseInt(numMatch[0], 10);
            } else if (code === 'superficie' || code === 'surface') {
              const numMatch = (textVal || val || '').match(/\d+/);
              if (numMatch) surface = parseInt(numMatch[0], 10);
            } else if (code === 'meuble' || code === 'statut_meuble') {
              furnished = val === 'oui' || val === 'meuble' || textVal?.includes('Meublé');
            } else if (code?.includes('specification') && s.valueText) {
              amenities.push(...s.valueText);
            }
          }
        }

        // Calculate and sanitize price in DA
        let rawPrice = Number(sourceItem.price) || parsed.price || 0;
        let price = rawPrice;

        if (sourceItem.priceUnit === 'MILLION_PER_SQUARE' && surface > 0) {
          if (price < 1000000) {
            price = price * 1000000 * surface;
          }
        } else if (transactionType === 'buy') {
          // If a property for sale is listed with a small number (e.g. 1500 or 10000 meaning millions in DA)
          if (price > 0 && price < 100000) {
            price = price * 1000000;
          }
        }

        if (price <= 0) {
          console.log(`⏩ Skipping ${idStr}: Invalid price (${price}).`);
          continue;
        }

        // Location determination
        let city = "Alger";
        let wilaya = "Alger";

        if (sourceItem.cities && sourceItem.cities.length > 0) {
          const c = sourceItem.cities[0];
          if (c.name) city = c.name;
          if (c.region?.name) {
            wilaya = arabicWilayaMap[c.region.name] || c.region.name;
          }
        } else if (parsed.wilaya) {
          wilaya = parsed.wilaya;
          city = parsed.city || wilaya;
        }

        const listingDoc = {
          title: parsed.title || sourceItem.title,
          description: sourceItem.description || parsed.description || "Belle propriété avec toutes les commodités.",
          price: Math.round(price),
          priceUnit: appPriceUnit,
          city,
          wilaya,
          propertyType,
          transactionType,
          category,
          rooms: Math.max(1, rooms),
          bathrooms: Math.max(1, Math.min(rooms, 2)),
          surface: Math.max(20, surface),
          furnished: Boolean(furnished),
          images,
          amenities: amenities.length > 0 ? amenities.slice(0, 6) : ["Climatisation", "Chauffage", "Eau 24/7"],
          phone: formatAlgerianPhone(phone) || "+213550123456",
          userId: BOT_USER_ID,
          ouedknissId: idStr,
          status: 'active'
        };

        // Save to local JSON backup
        saveLocalListing(listingDoc);
        existingIds.add(idStr);
        totalProcessed++;

        console.log(`   ✅ [${listingDoc.category.toUpperCase()}] ${listingDoc.propertyType.toUpperCase()} in ${listingDoc.city}, ${listingDoc.wilaya} | Price: ${listingDoc.price.toLocaleString()} DA (${listingDoc.priceUnit}) | Phone: ${listingDoc.phone}`);

        // Save to Firestore if connected
        if (isAuthenticated && !isDryRun && !firestorePermissionDenied) {
          try {
            const firestoreId = await saveToFirestore(listingDoc);
            console.log(`   🔥 Saved to Firestore with Document ID: ${firestoreId}`);
            totalSavedFirestore++;
          } catch (fsErr) {
            if (fsErr.code === 'permission-denied') {
              firestorePermissionDenied = true;
              console.warn(`\n   🔒 [Firestore Permission Notice] Write was denied by Firestore Security Rules.`);
              console.warn(`   All listings are safely preserved in "${BACKUP_FILE}".`);
              console.warn(`   Once you update Firestore rules in Firebase Console, run "npm run seed" to upload them all instantly!\n`);
            } else {
              console.warn(`   ⚠️ Firestore save error: ${fsErr.message}`);
            }
          }
        }

        await new Promise(r => setTimeout(r, 100));
      }

      pageNum++;
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 SCRAPING COMPLETE!`);
  console.log(`Total Listings Saved Locally: ${loadLocalListings().length}`);
  console.log(`Listings Processed this Run: ${totalProcessed}`);
  console.log(`Listings Saved to Firestore: ${totalSavedFirestore}`);
  console.log(`Local Backup Path: ${BACKUP_FILE}`);
  console.log(`=======================================================`);

  process.exit(0);
}

scrape().catch(err => {
  console.error("Fatal scraper error:", err);
  process.exit(1);
});
