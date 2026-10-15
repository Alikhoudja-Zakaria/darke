import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

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

const testEmails = [
  "alikhoudjazakariia@gmail.com",
  "alikhoudjazakaria@gmail.com",
  "alikoudjazakariia@gmail.com",
  "alikoudjazakaria@gmail.com",
  "botadmin@darkoum.com"
];

async function checkEmails() {
  for (const email of testEmails) {
    try {
      await signInWithEmailAndPassword(auth, email, "dummyPassword123!");
    } catch (err) {
      console.log(`${email} => Code: ${err.code} | Message: ${err.message}`);
    }
  }
}

checkEmails();
