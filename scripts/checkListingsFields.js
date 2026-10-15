import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

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

async function test() {
  const snap = await getDocs(query(collection(db, 'listings'), limit(20)));
  console.log('Total returned:', snap.size);
  const wilayas = new Set();
  const cities = new Set();
  const types = new Set();
  const trans = new Set();
  const cats = new Set();

  snap.forEach(d => {
    const data = d.data();
    wilayas.add(data.wilaya);
    cities.add(data.city);
    types.add(data.propertyType);
    trans.add(data.transactionType);
    cats.add(data.category);
    console.log({
      id: d.id,
      title: data.title?.slice(0, 25),
      wilaya: data.wilaya,
      city: data.city,
      propertyType: data.propertyType,
      transactionType: data.transactionType,
      category: data.category,
      price: data.price,
      priceUnit: data.priceUnit,
      rooms: data.rooms
    });
  });

  console.log('\nUnique in sample:');
  console.log('wilayas:', [...wilayas]);
  console.log('cities:', [...cities]);
  console.log('propertyTypes:', [...types]);
  console.log('transactionTypes:', [...trans]);
  console.log('categories:', [...cats]);
}

test().catch(console.error);
