import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  ConfirmationResult,
} from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Free Development / Trial Firebase Configuration
 * Reads from NEXT_PUBLIC_FIREBASE_* environment variables.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "your_api_key_here"
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured()) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    return auth;
  }
  return null;
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db;
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
    return db;
  }
  return null;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface TestPhoneNumberEntry {
  phoneNumber: string;
  testCode: string;
  label: string;
  country: string;
}

/**
 * Returns registered Firebase test phone numbers for development/trial OTP login.
 * Test numbers bypass SMS delivery in Firebase Auth (Zero SMS Cost).
 */
export function getTestPhoneNumbers(): TestPhoneNumberEntry[] {
  const envTestPhones = process.env.NEXT_PUBLIC_FIREBASE_TEST_PHONE_NUMBERS;
  
  if (envTestPhones) {
    // Expected format: "+16505551234:123456,+919999999999:123456"
    return envTestPhones
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.includes(":"))
      .map((entry) => {
        const [phone, code] = entry.split(":");
        const cleanPhone = phone.trim();
        const country = cleanPhone.startsWith("+91") ? "India" : cleanPhone.startsWith("+1") ? "US" : "Global";
        return {
          phoneNumber: cleanPhone,
          testCode: code.trim(),
          label: `${country} Dev Test (${cleanPhone})`,
          country,
        };
      });
  }

  // Standard Firebase Test Phone Numbers for local development & trial verification
  return [
    {
      phoneNumber: "+1 650-555-1234",
      testCode: "123456",
      label: "US Trial Test (+1 650-555-1234)",
      country: "US",
    },
    {
      phoneNumber: "+91 99999 99999",
      testCode: "123456",
      label: "India Trial Test (+91 99999 99999)",
      country: "India",
    },
    {
      phoneNumber: "+1 650-555-4321",
      testCode: "654321",
      label: "Staff QA Test (+1 650-555-4321)",
      country: "US",
    },
  ];
}

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
  role: string;
  providerId: string;
  isTestUser: boolean;
  createdAt: string;
  lastLoginAt: string;
}

/**
 * Creates or updates user profile in Firestore after successful authentication
 */
export async function createOrUpdateFirestoreProfile(
  uid: string,
  profile: Partial<FirestoreUserProfile>
): Promise<boolean> {
  const firestore = getFirebaseDb();
  if (!firestore) {
    // If Firebase Firestore is not configured or in offline sandbox trial
    console.info("[Trial Auth] Firestore offline or unconfigured; profile cached locally.");
    return false;
  }

  try {
    const userDocRef = doc(firestore, "users", uid);
    const payload: FirestoreUserProfile = {
      uid,
      email: profile.email || null,
      displayName: profile.displayName || "Academic Scholar",
      phoneNumber: profile.phoneNumber || null,
      photoURL: profile.photoURL || null,
      role: profile.role || "STUDENT",
      providerId: profile.providerId || "firebase",
      isTestUser: profile.isTestUser ?? false,
      createdAt: profile.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await setDoc(userDocRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn("[Firestore Profile] Failed to sync Firestore profile:", err);
    return false;
  }
}

export {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
};
export type { ConfirmationResult };
