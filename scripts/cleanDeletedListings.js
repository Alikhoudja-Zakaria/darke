import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

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

async function clean() {
  console.log("--- Starting Listing Integrity Check ---");
  try {
    // Query only active listings scraped from Ouedkniss
    const q = query(
      collection(db, 'listings'), 
      where('status', '==', 'active'),
      where('ouedknissId', '!=', '')
    );
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} active listings to verify.`);

    let checkedCount = 0;
    let deactivatedCount = 0;

    for (const document of querySnapshot.docs) {
      const data = document.data();
      const ouedknissId = data.ouedknissId;
      if (!ouedknissId) continue;

      // Deactivate immediately if it has no images
      const images = data.images;
      if (!images || !Array.isArray(images) || images.length === 0) {
        console.log(`[${++checkedCount}/${querySnapshot.size}] Listing ${ouedknissId} has no images. Deactivating in Firestore...`);
        const docRef = doc(db, 'listings', document.id);
        await updateDoc(docRef, { status: 'inactive' });
        deactivatedCount++;
        continue;
      }

      // Construct Ouedkniss URL or generic format.
      // Since Ouedkniss URLs are like: https://www.ouedkniss.com/slug-d123456
      // We can search them by their unique ID URL or redirect link:
      // Ouedkniss permits loading via direct announcement link by ID:
      const checkUrl = `https://www.ouedkniss.com/annonces/detail?id=${ouedknissId}`;
      
      console.log(`[${++checkedCount}/${querySnapshot.size}] Checking listing ${ouedknissId}...`);
      
      try {
        const response = await fetch(checkUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          },
          redirect: 'follow',
          method: 'GET'
        });

        const status = response.status;
        let isRemoved = false;

        if (status === 404) {
          isRemoved = true;
        } else if (status === 200) {
          const html = await response.text();
          // Check for common Ouedkniss markers indicating deleted/unavailable listings
          if (html.includes("introuvable") || 
              html.includes("n'existe plus") || 
              html.includes("Cette annonce n'est plus disponible") ||
              html.includes("annonce-supprimee") || 
              html.includes("Annonce supprimée")) {
            isRemoved = true;
          }
        }

        if (isRemoved) {
          console.log(`Listing ${ouedknissId} has been removed from Ouedkniss. Deactivating in Firestore...`);
          const docRef = doc(db, 'listings', document.id);
          await updateDoc(docRef, { status: 'inactive' });
          deactivatedCount++;
        }
      } catch (err) {
        console.error(`Network error checking listing ${ouedknissId}:`, err.message);
      }

      // 1 second delay to avoid hitting rate limits on check checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`Integrity check complete. Checked: ${checkedCount}, Deactivated: ${deactivatedCount}`);
  } catch (error) {
    console.error("Integrity check failed:", error);
  }
  process.exit(0);
}

clean();
