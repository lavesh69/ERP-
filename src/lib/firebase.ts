import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { UserProfile, Course, Announcement } from "@/types";

/**
 * Production Firebase Configuration
 * Reads from Vite environment variables (VITE_FIREBASE_*)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "AIzaSyYourFirebaseApiKeyHere"
  );
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined") {
  if (isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    } catch (e) {
      console.warn("[Firebase] Initialization error:", e);
    }
  }
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      return auth;
    } catch {}
  }
  return null;
}

export function getFirebaseDb(): Firestore | null {
  if (db) return db;
  if (typeof window !== "undefined" && isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      return db;
    } catch {}
  }
  return null;
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/**
 * Create or sync user profile document in Firestore (/users/{uid})
 */
export async function createOrUpdateFirestoreProfile(
  user: FirebaseUser,
  role: UserProfile["role"] = "STUDENT"
): Promise<UserProfile> {
  const firestore = getFirebaseDb();
  const existingCached = localStorage.getItem(`classroom_user_profile_${user.uid}`);
  let existingProfile: Partial<UserProfile> = {};

  if (existingCached) {
    try {
      existingProfile = JSON.parse(existingCached);
    } catch {}
  }

  const profilePayload: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || "Academic Scholar",
    photoURL: user.photoURL,
    role: existingProfile.role || role,
    providerId: user.providerData?.[0]?.providerId || "google.com",
    institutionId: "APEX-MAIN",
    institutionName: import.meta.env.VITE_APP_INSTITUTION_NAME || "Apex Institute of Science & Technology",
    createdAt: existingProfile.createdAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  // Cache locally for offline reliability & instant hydration
  localStorage.setItem(`classroom_user_profile_${user.uid}`, JSON.stringify(profilePayload));

  if (firestore) {
    try {
      const userRef = doc(firestore, "users", user.uid);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        const remoteData = snapshot.data() as UserProfile;
        profilePayload.role = remoteData.role || profilePayload.role;
        profilePayload.createdAt = remoteData.createdAt || profilePayload.createdAt;
      }
      await setDoc(userRef, profilePayload, { merge: true });
    } catch (err) {
      console.warn("[Firestore] Profile sync warning (offline or permissions):", err);
    }
  }

  return profilePayload;
}

/**
 * Fetch courses from Firestore or fallback to academic seed catalog
 */
export async function fetchCourses(): Promise<Course[]> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const coursesRef = collection(firestore, "courses");
      const q = query(coursesRef, limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Course));
      }
    } catch (e) {
      console.info("[Firestore] Fetching fallback seed catalog");
    }
  }

  return [
    {
      id: "course_1",
      code: "CS-402",
      title: "Advanced Neural Networks & Deep Learning",
      credits: 4,
      department: "Computer Science",
      facultyName: "Dr. Elena Rostova",
      semester: "Fall 2026",
      enrolledCount: 42,
    },
    {
      id: "course_2",
      code: "CS-301",
      title: "Operating Systems & Distributed Architecture",
      credits: 4,
      department: "Computer Science",
      facultyName: "Prof. Marcus Vance",
      semester: "Fall 2026",
      enrolledCount: 68,
    },
    {
      id: "course_3",
      code: "AI-505",
      title: "Autonomous Agents & Reinforcement Learning",
      credits: 3,
      department: "Artificial Intelligence",
      facultyName: "Dr. Alistair Chen",
      semester: "Fall 2026",
      enrolledCount: 35,
    },
    {
      id: "course_4",
      code: "MATH-204",
      title: "Linear Algebra & Stochastic Calculus",
      credits: 3,
      department: "Mathematics",
      facultyName: "Dr. Sophia Sterling",
      semester: "Fall 2026",
      enrolledCount: 80,
    },
  ];
}

/**
 * Fetch announcements from Firestore or fallback to academic noticeboard
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const annRef = collection(firestore, "announcements");
      const q = query(annRef, orderBy("createdAt", "desc"), limit(10));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
      }
    } catch {}
  }

  return [
    {
      id: "ann_1",
      title: "Mid-Term Examinations Schedule Published",
      content: "The centralized Autumn 2026 mid-term examination timetable is now available for all departments.",
      category: "EXAM",
      author: "Office of the Registrar",
      createdAt: "Today at 09:30 AM",
    },
    {
      id: "ann_2",
      title: "Campus AI & Robotics Research Symposium",
      content: "Annual peer review submissions for research grants and graduate fellowship fellowships are open.",
      category: "ACADEMIC",
      author: "Dean of Research",
      createdAt: "Yesterday",
    },
    {
      id: "ann_3",
      title: "Library Extended Hours for Final Projects",
      content: "The Central Alan Turing Library and digital labs will remain open 24/7 through examination week.",
      category: "CAMPUS",
      author: "University Library",
      createdAt: "2 days ago",
    },
  ];
}

export { signInWithPopup, firebaseSignOut };
