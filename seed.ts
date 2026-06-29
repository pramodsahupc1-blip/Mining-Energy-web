import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  try {
    const mobile = "8144553816";
    const password = "admin16";
    const email = `${mobile}@miningenergy.app`;
    const fullName = "System Admin";
    const referralCode = "ADMIN777";

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    await setDoc(doc(db, "users", userId), {
      fullName,
      mobile,
      referralCode,
      referredBy: null,
      role: "admin",
      createdAt: serverTimestamp()
    });

    await setDoc(doc(db, "wallets", userId), {
      available: 100000,
      investment: 0,
      earnings: 0,
      lastCheckIn: null
    });

    console.log("Admin seeded successfully with UID:", userId);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log("Admin user already exists in Firebase Auth");
    } else {
      console.error("Error seeding:", error);
    }
  }
  process.exit(0);
}

seed();
