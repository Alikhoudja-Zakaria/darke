import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, doc } from "firebase/firestore";
import { wilayas } from "../src/data/cities.js";

const firebaseConfig = {
  apiKey: "AIzaSyA2BIvH0HTFJ4clvx5aQ1tinfcg34YIChI",
  authDomain: "studio-1088250814-d2038.firebaseapp.com",
  projectId: "studio-1088250814-d2038",
  storageBucket: "studio-1088250814-d2038.firebasestorage.app",
  messagingSenderId: "545622549899",
  appId: "1:545622549899:web:cdcf26ecd9f3212e90bb8e"
};

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Map of common communes to their wilaya
const communeToWilaya = {
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
  "chrea": "Blida",
  "boufarik": "Blida",
  "ouled yaich": "Blida",
  "khemis el khechna": "Boumerdès",
  "corso": "Boumerdès",
  "thenia": "Boumerdès",
  "boudouaou": "Boumerdès",
  "zemmouri": "Boumerdès",
  "kolea": "Tipaza",
  "bou ismail": "Tipaza",
  "fouka": "Tipaza",
  "cherchell": "Tipaza",
  "sidi fredj": "Alger",
  "canastel": "Oran",
  "bir el djir": "Oran",
  "es senia": "Oran",
  "ain el turck": "Oran",
  "akbou": "Béjaïa",
  "sidi aich": "Béjaïa",
  "beni ksila": "Béjaïa",
  "seraidi": "Annaba"
};

const norm = (str) => (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

async function run() {
  console.log("Signing in as botadmin...");
  await signInWithEmailAndPassword(auth, "botadmin@darkoum.com", "Zakataka@1");
  console.log("Authenticated as botadmin. Reading listings from Firestore...");
  const snapshot = await getDocs(collection(db, "listings"));
  console.log(`Found ${snapshot.size} total listings in Firestore.`);

  const updates = [];

  snapshot.forEach(d => {
    const data = d.data();
    if (!data.wilaya) {
      const cityNorm = norm(data.city);
      let detectedWilaya = null;

      // 1. Direct match with a wilaya name
      const directWilaya = wilayas.find(w => norm(w.name) === cityNorm || w.nameAr === data.city);
      if (directWilaya) {
        detectedWilaya = directWilaya.name;
      }

      // 2. Commune lookup
      if (!detectedWilaya && communeToWilaya[cityNorm]) {
        detectedWilaya = communeToWilaya[cityNorm];
      }

      // 3. Search in title
      if (!detectedWilaya && data.title) {
        const titleNorm = norm(data.title);
        const inTitle = wilayas.find(w => titleNorm.includes(norm(w.name)) || (w.nameAr && data.title.includes(w.nameAr)));
        if (inTitle) {
          detectedWilaya = inTitle.name;
        }
      }

      // Default fallback if city contains Alger
      if (!detectedWilaya && (cityNorm.includes('alger') || (data.title && norm(data.title).includes('alger')))) {
        detectedWilaya = "Alger";
      }

      if (detectedWilaya) {
        updates.push({ id: d.id, wilaya: detectedWilaya, prevCity: data.city });
      }
    }
  });

  console.log(`Identified ${updates.length} listings to update with wilaya.`);

  if (updates.length > 0) {
    const CHUNK_SIZE = 400;
    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      chunk.forEach(u => {
        batch.update(doc(db, "listings", u.id), { wilaya: u.wilaya });
      });
      await batch.commit();
      console.log(`Updated chunk ${i / CHUNK_SIZE + 1} (${chunk.length} items).`);
    }
  }

  console.log("Database wilaya normalization completed!");
}

run().catch(console.error);
