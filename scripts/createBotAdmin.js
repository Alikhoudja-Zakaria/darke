import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

async function main() {
  const email = "botadmin@darkoum.com";
  const password = "Zakataka@1";
  const displayName = "Bot Admin";
  const phone = "+213555555555";

  console.log(`Creating user: ${email}...`);
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log(`User created in Firebase Auth with UID: ${user.uid}`);

    // Seed Firestore user document
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName,
      email,
      phone,
      role: "botadmin",
      createdAt: new Date().toISOString()
    });
    console.log("Firestore user profile created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating botadmin user:", error.message || error);
    process.exit(1);
  }
}

main();
