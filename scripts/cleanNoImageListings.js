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

async function cleanNoImages() {
  console.log("--- Starting Database Cleanup for Listings with No Images ---");
  try {
    const q = query(
      collection(db, 'listings'), 
      where('status', '==', 'active')
    );
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} active listings in total.`);

    let checkedCount = 0;
    let deactivatedCount = 0;

    for (const document of querySnapshot.docs) {
      const data = document.data();
      const images = data.images;
      
      const hasNoImages = !images || !Array.isArray(images) || images.length === 0;

      if (hasNoImages) {
        console.log(`Listing ID ${document.id} (Ouedkniss ID: ${data.ouedknissId || 'None'}) has no images. Deactivating...`);
        const docRef = doc(db, 'listings', document.id);
        await updateDoc(docRef, { status: 'inactive' });
        deactivatedCount++;
      }
      checkedCount++;
    }

    console.log(`Cleanup complete. Checked: ${checkedCount}, Deactivated: ${deactivatedCount}`);
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
  process.exit(0);
}

cleanNoImages();
