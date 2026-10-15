import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 58 Algerian Wilayas Mapping (Arabic & French)
export const ARABIC_WILAYA_MAP = {
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

// Clean and normalize Algerian phone number
export const formatAlgerianPhone = (rawPhone) => {
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
};

// Extract phone from text description
export const extractPhoneFromText = (text) => {
  if (!text) return null;
  const matches = text.match(/(?:(?:\+|00)213\s?|0)[5-7]\d(?:[\s.-]?\d{2}){4}/g);
  if (matches && matches.length > 0) {
    const formatted = formatAlgerianPhone(matches[0]);
    if (formatted) return formatted;
  }
  return null;
};

// Detect property type
export const detectPropertyType = (title = '', slug = '', description = '') => {
  const combined = `${title} ${slug} ${description}`.toLowerCase();

  if (combined.includes('terrain') || combined.includes('terre') || combined.includes('agricole') || combined.includes('lot de terrain')) {
    return 'land';
  }
  if (combined.includes('villa') || combined.includes('carcasse')) {
    return 'villa';
  }
  if (combined.includes('immeuble') || combined.includes('local') || combined.includes('magasin') || combined.includes('hangar') || combined.includes('bureau')) {
    return 'commercial';
  }
  if (combined.includes('bungalow') || combined.includes('chalet') || combined.includes('maison') || combined.includes('duplex') || combined.includes('niveau de villa')) {
    return 'house';
  }
  if (combined.includes('studio')) {
    return 'studio';
  }
  if (combined.includes('appartement') || combined.includes('appart') || /f[1-6]\b/.test(combined)) {
    return 'apartment';
  }

  return 'apartment';
};

export const isListingDuplicate = async (ouedknissId) => {
  try {
    const q = query(collection(db, 'listings'), where('ouedknissId', '==', String(ouedknissId)));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (err) {
    console.warn("Duplicate check error:", err);
    return false;
  }
};

/**
 * GraphQL API endpoint router:
 * Uses Vite proxy (/api/ouedkniss/graphql) in development, falls back to direct URL.
 */
const getGraphQLEndpoint = () => {
  if (typeof window !== 'undefined') {
    return '/api/ouedkniss/graphql';
  }
  return 'https://api.ouedkniss.com/graphql';
};

// Query Ouedkniss Search API
export const queryOuedknissListings = async (categorySlug = 'immobilier', page = 1, count = 30) => {
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

  const endpoint = getGraphQLEndpoint();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "*/*",
      "locale": "fr"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) {
    throw new Error(`API Ouedkniss a renvoyé l'état HTTP ${res.status}`);
  }

  const json = await res.json();
  return json?.data?.search?.announcements?.data || [];
};

// Query Ouedkniss Single Listing Details
export const queryOuedknissDetails = async (id) => {
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

  const endpoint = getGraphQLEndpoint();
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "locale": "fr"
    },
    body: JSON.stringify(query)
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json?.data?.announcement || null;
};

/**
 * Main Scraper execution engine with real-time events.
 */
export const runOuedknissScraper = async ({
  category = 'all', // 'all' | 'immobilier' | 'leisure' | 'appartement' | 'villa' | 'terrain'
  wilayaTarget = '',
  targetCount = 20,
  saveToFirestore = true,
  userId = null,
  onLog = () => {},
  onProgress = () => {},
  onItemFound = () => {},
  isAborted = () => false
}) => {
  onLog(`🚀 Démarrage du scraper Ouedkniss (Cible: ${targetCount} annonces)`, 'info');

  let categorySlugs = ["immobilier"];
  if (category === 'leisure') {
    categorySlugs = ["immobilier-location-vacances"];
  } else if (category === 'appartement') {
    categorySlugs = ["immobilier-appartement"];
  } else if (category === 'villa') {
    categorySlugs = ["immobilier-villa"];
  } else if (category === 'terrain') {
    categorySlugs = ["immobilier-terrain"];
  } else if (category === 'all') {
    categorySlugs = ["immobilier", "immobilier-location-vacances"];
  }

  const scrapedListings = [];
  let totalSaved = 0;
  let totalProcessed = 0;

  for (const catSlug of categorySlugs) {
    if (totalProcessed >= targetCount || isAborted()) break;

    onLog(`📡 Recherche dans la catégorie Ouedkniss: '${catSlug}'...`, 'info');
    let page = 1;

    while (totalProcessed < targetCount && page <= 5) {
      if (isAborted()) {
        onLog(`⏹️ Arrêt du scraper demandé par l'administrateur.`, 'warning');
        break;
      }

      let announcements;
      try {
        announcements = await queryOuedknissListings(catSlug, page, 35);
      } catch (err) {
        onLog(`⚠️ Erreur d'accès à l'API Ouedkniss (${err.message})`, 'error');
        break;
      }

      if (!announcements || announcements.length === 0) {
        onLog(`Aucune annonce supplémentaire sur la page ${page}.`, 'info');
        break;
      }

      onLog(`Page ${page} : ${announcements.length} annonces reçues. Analyse en cours...`, 'info');

      for (const item of announcements) {
        if (totalProcessed >= targetCount || isAborted()) break;

        const idStr = String(item.id);

        // Filter by target Wilaya if specified
        if (wilayaTarget) {
          const itemRegion = item.cities?.[0]?.region?.name;
          const mappedWilaya = ARABIC_WILAYA_MAP[itemRegion] || itemRegion;
          if (mappedWilaya && !mappedWilaya.toLowerCase().includes(wilayaTarget.toLowerCase())) {
            continue;
          }
        }

        // Duplicate check in Firestore
        if (saveToFirestore) {
          const isDup = await isListingDuplicate(idStr);
          if (isDup) {
            onLog(`⏩ Ignorée : l'annonce #${idStr} existe déjà dans Darkoum.`, 'info');
            continue;
          }
        }

        onLog(`🔍 [${totalProcessed + 1}/${targetCount}] Extraction des détails pour #${idStr} : "${item.title}"...`, 'info');

        // Fetch deep announcement details (specs + HD photos)
        let details = null;
        try {
          details = await queryOuedknissDetails(idStr);
        } catch (err) {
          console.warn(`Could not fetch details for #${idStr}:`, err);
        }

        const sourceItem = details || item;

        // Extract HD photos
        let images = [];
        if (details?.medias && details.medias.length > 0) {
          images = details.medias.map(m => m.mediaUrl).filter(Boolean);
        } else if (item.medias && item.medias.length > 0) {
          images = item.medias.map(m => m.mediaUrl).filter(Boolean);
        }
        if (sourceItem.defaultMedia?.mediaUrl && !images.includes(sourceItem.defaultMedia.mediaUrl)) {
          images.unshift(sourceItem.defaultMedia.mediaUrl);
        }

        // Max 8 photos
        images = images.slice(0, 8);
        if (images.length === 0) {
          onLog(`⏩ Ignorée #${idStr} : Aucune photo disponible.`, 'warning');
          continue;
        }

        // Detect Location
        let city = "Alger";
        let wilaya = "Alger";
        if (sourceItem.cities && sourceItem.cities.length > 0) {
          const c = sourceItem.cities[0];
          if (c.name) city = c.name;
          if (c.region?.name) {
            wilaya = ARABIC_WILAYA_MAP[c.region.name] || c.region.name;
          }
        }

        // Detect Property Type, Category & Transaction
        const propertyType = detectPropertyType(sourceItem.title, catSlug, sourceItem.description || '');
        const lowerTitle = sourceItem.title.toLowerCase();
        const isLeisure = catSlug.includes('vacance') || lowerTitle.includes('vacance') || lowerTitle.includes('nuitée');
        
        const finalCategory = isLeisure ? 'leisure' : 'long-term';
        const transactionType = isLeisure 
          ? 'rent' 
          : (lowerTitle.includes('vente') || catSlug.includes('vente') ? 'sale' : 'rent');

        const priceUnit = isLeisure ? 'per-night' : (transactionType === 'rent' ? 'per-month' : 'total');

        // Parse Specs
        let rooms = 1;
        let surface = 80;
        let furnished = isLeisure;
        const amenities = [];

        if (details?.specs) {
          for (const s of details.specs) {
            const code = s.specification?.codename;
            const val = s.value?.[0];
            const textVal = s.valueText?.[0];

            if (code === 'pieces_appartement' || code === 'pieces' || code === 'nombre_pieces') {
              const num = (textVal || val || '').match(/\d+/);
              if (num) rooms = parseInt(num[0], 10);
            } else if (code === 'superficie' || code === 'surface') {
              const num = (textVal || val || '').match(/\d+/);
              if (num) surface = parseInt(num[0], 10);
            } else if (code === 'meuble' || code === 'statut_meuble') {
              furnished = val === 'oui' || val === 'meuble' || textVal?.includes('Meublé');
            } else if (s.valueText) {
              amenities.push(...s.valueText);
            }
          }
        }

        // Fallback title room match (e.g. F3, F4)
        const roomMatch = lowerTitle.match(/f(\d)\b/);
        if (roomMatch && rooms === 1) {
          rooms = parseInt(roomMatch[1], 10);
        }

        // Calculate and sanitize Price in DA
        let rawPrice = Number(sourceItem.price) || 0;
        let price = rawPrice;

        if (sourceItem.priceUnit === 'MILLION_PER_SQUARE' && surface > 0) {
          if (price < 1000000) {
            price = price * 1000000 * surface;
          }
        } else if (transactionType === 'sale') {
          // If a property for sale is written as 1500 (meaning 15,000,000 DA)
          if (price > 0 && price < 100000) {
            price = price * 1000000;
          }
        }

        if (price <= 0) {
          // Reasonable default estimate if price was "Négociable" / 0
          price = isLeisure ? 15000 : (transactionType === 'rent' ? 55000 : 18000000);
        }

        // Extract Phone
        let phone = extractPhoneFromText(sourceItem.description) || 
                    extractPhoneFromText(sourceItem.store?.description) ||
                    "+213550123456";

        const listingDoc = {
          title: sourceItem.title,
          description: sourceItem.description || "Belle propriété avec toutes les commodités à proximité.",
          price: Math.round(price),
          priceUnit,
          city,
          wilaya,
          propertyType,
          transactionType,
          category: finalCategory,
          rooms: Math.max(1, rooms),
          bathrooms: Math.max(1, Math.min(rooms, 2)),
          surface: Math.max(20, surface),
          furnished: Boolean(furnished),
          images,
          amenities: amenities.length > 0 ? amenities.slice(0, 6) : ["Climatisation", "Chauffage", "Eau 24/7"],
          phone: formatAlgerianPhone(phone) || "+213550123456",
          userId: userId || "XsU0w8gUmzW6UkCP31Cii5P1Q5U2", // Admin UID or Bot Admin fallback
          ouedknissId: idStr,
          status: 'active',
          isFeatured: false
        };

        // Save to Firestore if requested
        if (saveToFirestore) {
          try {
            const docRef = await addDoc(collection(db, 'listings'), {
              ...listingDoc,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            listingDoc.id = docRef.id;
            totalSaved++;
            onLog(`🔥 [Enregistrée dans Firestore] ID: ${docRef.id} | ${listingDoc.city} (${listingDoc.wilaya}) - ${listingDoc.price.toLocaleString()} DA`, 'success');
          } catch (fsErr) {
            onLog(`⚠️ Erreur d'enregistrement Firestore: ${fsErr.message}`, 'error');
          }
        }

        scrapedListings.push(listingDoc);
        totalProcessed++;
        onItemFound(listingDoc);
        onProgress(totalProcessed, targetCount);

        // Rate limit pause (150ms) to respect server
        await new Promise(r => setTimeout(r, 150));
      }

      page++;
    }
  }

  onLog(`🎉 Scraping terminé ! ${totalProcessed} annonces traitées, ${totalSaved} enregistrées dans Firestore.`, 'success');
  return scrapedListings;
};

/**
 * Fetch a batch of listings that have ouedknissId for auditing.
 */
export const fetchOuedknissListingsForAudit = async (maxCount = 50) => {
  const q = query(collection(db, 'listings'), where('ouedknissId', '!=', null), limit(maxCount));
  const snap = await getDocs(q);
  const items = [];
  snap.forEach(d => items.push({ id: d.id, ...d.data() }));
  return items;
};

/**
 * Check if a single Ouedkniss announcement still exists and is published.
 * Returns { exists: boolean, status: string }
 */
export const checkOuedknissAnnouncementExists = async (ouedknissId) => {
  if (!ouedknissId) return { exists: false, status: 'NO_ID' };

  const query = {
    operationName: "AnnouncementCheck",
    variables: { id: String(ouedknissId) },
    query: `query AnnouncementCheck($id: ID!) {
      announcement: announcementDetails(id: $id) {
        id
        status
      }
    }`
  };

  const endpoint = getGraphQLEndpoint();
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "locale": "fr"
      },
      body: JSON.stringify(query)
    });

    if (!res.ok) {
      if (res.status === 404) return { exists: false, status: 'NOT_FOUND_404' };
      return { exists: false, status: `HTTP_${res.status}` };
    }

    const json = await res.json();
    const ann = json?.data?.announcement;
    if (!ann || !ann.id) {
      return { exists: false, status: 'NOT_FOUND_NULL' };
    }

    const isPublished = ann.status === 'PUBLISHED';
    return {
      exists: isPublished,
      status: ann.status || 'UNKNOWN'
    };
  } catch (err) {
    console.warn(`Error checking Ouedkniss ID ${ouedknissId}:`, err);
    // On network failure, preserve by default
    return { exists: true, status: 'NETWORK_ERROR' };
  }
};

/**
 * Audit Ouedkniss listings in Darkoum and automatically delete those that no longer exist.
 */
export const runOuedknissAuditAndCleaner = async ({
  listings = [],
  action = 'delete', // 'delete' | 'hide'
  onLog = () => {},
  onProgress = () => {},
  isAborted = () => false
}) => {
  onLog(`🔍 Démarrage de l'audit Ouedkniss (${listings.length} annonces à analyser)...`, 'info');

  let checkedCount = 0;
  let deletedCount = 0;
  let activeCount = 0;
  const deletedDocIds = [];

  for (const item of listings) {
    if (isAborted()) {
      onLog("⏹️ Audit interrompu par l'administrateur.", 'warning');
      break;
    }

    if (!item.ouedknissId) {
      continue;
    }

    checkedCount++;
    onProgress(checkedCount, listings.length);

    const check = await checkOuedknissAnnouncementExists(item.ouedknissId);

    if (check.exists) {
      activeCount++;
      onLog(`✅ [#${item.ouedknissId}] "${(item.title || '').slice(0, 30)}..." est toujours active sur Ouedkniss.`, 'info');
    } else if (check.status === 'NETWORK_ERROR') {
      onLog(`⚠️ [#${item.ouedknissId}] : Erreur de connexion, annonce conservée par sécurité.`, 'warning');
    } else {
      // Annonce deleted or archived on Ouedkniss!
      onLog(`❌ [#${item.ouedknissId}] "${(item.title || '').slice(0, 30)}..." n'existe plus sur Ouedkniss (${check.status}). Suppression en cours...`, 'warning');

      try {
        if (action === 'delete') {
          await deleteDoc(doc(db, 'listings', item.id));
          deletedCount++;
          deletedDocIds.push(item.id);
          onLog(`🗑️ Annonce #${item.id} (Ouedkniss #${item.ouedknissId}) supprimée définitivement de Firestore.`, 'error');
        } else {
          await updateDoc(doc(db, 'listings', item.id), {
            status: 'hidden',
            updatedAt: serverTimestamp()
          });
          deletedCount++;
          deletedDocIds.push(item.id);
          onLog(`🔒 Annonce #${item.id} (Ouedkniss #${item.ouedknissId}) masquée (statut: hidden).`, 'warning');
        }
      } catch (err) {
        onLog(`⚠️ Erreur de suppression pour #${item.id}: ${err.message}`, 'error');
      }
    }

    // Rate-limit pause (100ms)
    await new Promise(r => setTimeout(r, 100));
  }

  onLog(`🏁 Audit terminé ! ${checkedCount} annonces vérifiées. ${activeCount} actives conservées, ${deletedCount} annonces obsolètes supprimées.`, 'success');

  return { checkedCount, activeCount, deletedCount, deletedDocIds };
};

