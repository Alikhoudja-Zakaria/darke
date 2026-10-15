import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

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

const BOT_EMAIL = "botadmin@darkoum.com";
const BOT_PASSWORD = "Zakataka@1";

async function checkIfListingExists(ouedknissId) {
  try {
    const q = query(collection(db, 'listings'), where('ouedknissId', '==', String(ouedknissId)));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    throw error;
  }
}

async function seed() {
  const isDryRun = process.argv.includes('--dry-run');
  const limitIdx = process.argv.indexOf('--limit');
  const limit = limitIdx !== -1 && process.argv[limitIdx + 1] ? parseInt(process.argv[limitIdx + 1], 10) : Infinity;

  console.log(`=======================================================`);
  console.log(`🌱 DARKOUM FIRESTORE SEEDER`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'PRODUCTION'}`);
  console.log(`=======================================================\n`);

  if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`❌ Backup file not found at ${BACKUP_FILE}. Please run the scraper first.`);
    process.exit(1);
  }

  const listings = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  console.log(`📦 Loaded ${listings.length} listings from ${BACKUP_FILE}`);

  console.log(`🔑 Authenticating as ${BOT_EMAIL}...`);
  try {
    const cred = await signInWithEmailAndPassword(auth, BOT_EMAIL, BOT_PASSWORD);
    console.log(`✅ Authenticated successfully! (UID: ${cred.user.uid})\n`);
  } catch (authErr) {
    console.error(`❌ Authentication failed: ${authErr.message}`);
    process.exit(1);
  }

  let insertedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < Math.min(listings.length, limit); i++) {
    const listing = listings[i];
    const { scrapedAt, updatedAt, ...docData } = listing;

    try {
      // Check if already in Firestore
      const exists = await checkIfListingExists(listing.ouedknissId);
      if (exists) {
        skippedCount++;
        console.log(`⏩ [${i + 1}/${listings.length}] Listing ${listing.ouedknissId} ("${listing.title.substring(0, 30)}...") already exists.`);
        continue;
      }

      if (isDryRun) {
        insertedCount++;
        console.log(`🔍 [${i + 1}/${listings.length}] [DRY-RUN] Would insert: "${listing.title}" (${listing.price} DA)`);
      } else {
        const docRef = await addDoc(collection(db, 'listings'), {
          ...docData,
          createdAt: serverTimestamp(),
          status: 'active'
        });
        insertedCount++;
        console.log(`🔥 [${i + 1}/${listings.length}] Inserted: "${listing.title}" => Doc ID: ${docRef.id}`);
      }
    } catch (err) {
      errorCount++;
      if (err.code === 'permission-denied') {
        console.error(`\n❌ [Permission Denied] Firestore rejected write.`);
        console.error(`Please update Firestore rules in Firebase Console to:`);
        console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /listings/{listingId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
`);
        process.exit(1);
      } else {
        console.error(`⚠️ Error inserting listing ${listing.ouedknissId}:`, err.message);
      }
    }
  }

  console.log(`\n=======================================================`);
  console.log(`🎉 SEEDING SUMMARY:`);
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`=======================================================`);

  process.exit(0);
}

seed().catch(err => {
  console.error("Fatal seeding error:", err);
  process.exit(1);
});
