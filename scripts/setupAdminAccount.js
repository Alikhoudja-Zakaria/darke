import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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

const adminEmail = "alikhoudjazakariia@gmail.com";
const defaultPassword = "AdminDarkoum2026!";

async function setupAdmin() {
  let user;
  try {
    console.log(`Attempting to create ${adminEmail}...`);
    const cred = await createUserWithEmailAndPassword(auth, adminEmail, defaultPassword);
    user = cred.user;
    console.log(`Successfully created ${adminEmail} with UID: ${user.uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      console.log(`${adminEmail} already exists in Firebase Auth!`);
      // Try to sign in with default or known password
      try {
        const cred = await signInWithEmailAndPassword(auth, adminEmail, defaultPassword);
        user = cred.user;
        console.log(`Signed in with default password. UID: ${user.uid}`);
      } catch (signInErr) {
        console.log(`User exists with custom password (${signInErr.code}). UID unknown.`);
      }
    } else {
      console.error(`Error creating user: ${err.code} - ${err.message}`);
    }
  }

  if (user) {
    // Write admin profile to Firestore users collection
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: "Zakaria Ali Khoudja",
      email: adminEmail,
      phone: "0555000000",
      role: "admin",
      isAdmin: true,
      createdAt: new Date().toISOString()
    }, { merge: true });
    console.log("Firestore admin document created with role: 'admin'!");
  }
  process.exit(0);
}

setupAdmin();
