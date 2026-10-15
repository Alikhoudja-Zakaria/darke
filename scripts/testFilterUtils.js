import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { filterListings } from "../src/utils/filterUtils.js";

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

async function runTests() {
  console.log("Fetching listings from Firestore to test filterUtils...");
  const snap = await getDocs(collection(db, "listings"));
  const items = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.status !== 'hidden' && data.status !== 'inactive') {
      items.push({ id: d.id, ...data });
    }
  });
  console.log(`Loaded ${items.length} active listings for testing.\n`);

  // Test 1: Wilaya filter "Alger"
  const algerListings = filterListings(items, "", { city: "Alger" });
  console.log(`Test 1 [City = "Alger"]: ${algerListings.length} matches (Expected > 150)`);

  // Test 2: Wilaya filter "Oran"
  const oranListings = filterListings(items, "", { city: "Oran" });
  console.log(`Test 2 [City = "Oran"]: ${oranListings.length} matches (Expected > 0)`);

  // Test 3: Wilaya filter "Boumerdès"
  const boumerdesListings = filterListings(items, "", { city: "Boumerdès" });
  console.log(`Test 3 [City = "Boumerdès"]: ${boumerdesListings.length} matches (Expected > 0)`);

  // Test 4: Transaction "buy"
  const buyListings = filterListings(items, "", { transactionType: "buy" });
  console.log(`Test 4 [Transaction = "buy"]: ${buyListings.length} matches (Expected > 150)`);

  // Test 5: Transaction "rent"
  const rentListings = filterListings(items, "", { transactionType: "rent" });
  console.log(`Test 5 [Transaction = "rent"]: ${rentListings.length} matches (Expected > 50)`);

  // Test 6: Property Type "villa"
  const villaListings = filterListings(items, "", { propertyType: "villa" });
  console.log(`Test 6 [Property = "villa"]: ${villaListings.length} matches (Expected > 30)`);

  // Test 7: Property Type "apartment"
  const aptListings = filterListings(items, "", { propertyType: "apartment" });
  console.log(`Test 7 [Property = "apartment"]: ${aptListings.length} matches (Expected > 50)`);

  // Test 8: Price range
  const priceListings = filterListings(items, "", { minPrice: "1000000", maxPrice: "50000000" });
  console.log(`Test 8 [Price 1M to 50M DA]: ${priceListings.length} matches (Expected > 50)`);

  // Test 9: Multi-word search "Cheraga"
  const cheragaSearch = filterListings(items, "cheraga", {});
  console.log(`Test 9 [Search "cheraga"]: ${cheragaSearch.length} matches`);

  // Test 10: Multi-word search "F3 Alger"
  const f3AlgerSearch = filterListings(items, "F3 Alger", {});
  console.log(`Test 10 [Search "F3 Alger"]: ${f3AlgerSearch.length} matches`);

  // Test 11: Combined filters: Alger + Buy + Apartment
  const combined = filterListings(items, "", { city: "Alger", transactionType: "buy", propertyType: "apartment" });
  console.log(`Test 11 [Alger + Buy + Apartment]: ${combined.length} matches`);

  console.log("\nAll filter tests executed successfully!");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
