import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function count() {
  try {
    const querySnapshot = await getDocs(collection(db, 'listings'));
    console.log(`Total listings in collection 'listings': ${querySnapshot.size}`);
    
    // Group by category, transactionType, and propertyType
    const stats = {};
    querySnapshot.forEach(doc => {
      const data = doc.data();
      const cat = data.category || 'unknown';
      const trans = data.transactionType || 'unknown';
      const prop = data.propertyType || 'unknown';
      const key = `${cat}/${trans}/${prop}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    console.log('Listing statistics:', stats);
  } catch (error) {
    console.error("Error reading listings:", error);
  }
  process.exit(0);
}

count();
