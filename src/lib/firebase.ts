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
import { UserProfile, Course, Announcement, RegistrationApplication, AccountStatus, UserRole } from "@/types";

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
    status: (existingProfile.status || "APPROVED") as AccountStatus,
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
        profilePayload.status = remoteData.status || profilePayload.status;
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

const LOCAL_STORAGE_APPS_KEY = "classroom_registration_applications";

/**
 * Submit a new self-registration application
 */
export async function submitRegistrationApplication(
  data: Omit<RegistrationApplication, "id" | "status" | "submittedAt">
): Promise<RegistrationApplication> {
  const firestore = getFirebaseDb();
  const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const application: RegistrationApplication = {
    ...data,
    id: appId,
    status: "PENDING_APPROVAL",
    submittedAt: new Date().toISOString(),
  };

  // Local storage caching for instant trial testing
  const existingRaw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
  let applications: RegistrationApplication[] = [];
  if (existingRaw) {
    try {
      applications = JSON.parse(existingRaw);
    } catch {}
  }
  applications.unshift(application);
  localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(applications));

  // Sync to Firestore if configured
  if (firestore) {
    try {
      await setDoc(doc(firestore, "registration_applications", appId), application);
      // Also update or mark user doc status as PENDING_APPROVAL
      await setDoc(
        doc(firestore, "users", data.uid),
        {
          status: "PENDING_APPROVAL",
          requestedRole: data.requestedRole,
          department: data.department,
          idNumber: data.idNumber,
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[Firestore] Registration application offline save:", e);
    }
  }

  // Update cached profile
  const cachedUserKey = `classroom_user_profile_${data.uid}`;
  const cachedUserRaw = localStorage.getItem(cachedUserKey);
  if (cachedUserRaw) {
    try {
      const u = JSON.parse(cachedUserRaw);
      u.status = "PENDING_APPROVAL";
      u.requestedRole = data.requestedRole;
      u.department = data.department;
      u.idNumber = data.idNumber;
      localStorage.setItem(cachedUserKey, JSON.stringify(u));
    } catch {}
  }

  return application;
}

/**
 * Fetch all registration applications (with mock seed for testing)
 */
export async function fetchRegistrationApplications(): Promise<RegistrationApplication[]> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const appsRef = collection(firestore, "registration_applications");
      const snap = await getDocs(appsRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RegistrationApplication));
      }
    } catch (e) {
      console.info("[Firestore] Reading local registration queue");
    }
  }

  const existingRaw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
  if (existingRaw) {
    try {
      const list = JSON.parse(existingRaw);
      if (Array.isArray(list) && list.length > 0) return list;
    } catch {}
  }

  // Default seed applications for immediate admin demo
  const defaultSeeds: RegistrationApplication[] = [
    {
      id: "app_seed_1",
      uid: "user_applicant_1",
      fullName: "Ananya Sharma",
      email: "ananya.sharma26@gmail.com",
      requestedRole: "STUDENT",
      department: "Computer Science & Engineering",
      idNumber: "2026-CSE-042",
      phone: "+91 98765 43210",
      notes: "Admitted via Merit Quota Round 1. Fee receipt attached.",
      status: "PENDING_APPROVAL",
      submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: "app_seed_2",
      uid: "user_applicant_2",
      fullName: "Dr. Rajeshwar Kulkarni",
      email: "rajeshwar.kulkarni@univ.ac.in",
      requestedRole: "FACULTY",
      department: "Artificial Intelligence",
      idNumber: "FAC-AI-88",
      phone: "+91 98111 22334",
      notes: "Appointed as Associate Professor, Joining Letter Ref #AP-2026-09.",
      status: "PENDING_APPROVAL",
      submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
      id: "app_seed_3",
      uid: "user_applicant_3",
      fullName: "Vikram Malhotra",
      email: "vikram.malhotra@parent.net",
      requestedRole: "PARENT",
      department: "Mechanical Engineering",
      idNumber: "WARD-ME-119",
      phone: "+91 98222 33445",
      notes: "Father of Rohan Malhotra (Roll: ME-119).",
      status: "PENDING_APPROVAL",
      submittedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];

  localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(defaultSeeds));
  return defaultSeeds;
}

/**
 * Review an application (Approve or Reject)
 */
export async function reviewRegistrationApplication(
  applicationId: string,
  uid: string,
  decision: "APPROVED" | "REJECTED",
  role: UserRole,
  reason?: string,
  reviewerName: string = "Institution Administrator"
): Promise<void> {
  const firestore = getFirebaseDb();
  const reviewedAt = new Date().toISOString();

  // Update local storage queue
  const existingRaw = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
  if (existingRaw) {
    try {
      const list: RegistrationApplication[] = JSON.parse(existingRaw);
      const updated = list.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              status: decision,
              reviewedAt,
              reviewedBy: reviewerName,
              rejectionReason: reason || undefined,
            }
          : a
      );
      localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(updated));
    } catch {}
  }

  // Update user's profile in local storage if present
  const userProfileKey = `classroom_user_profile_${uid}`;
  const userProfileRaw = localStorage.getItem(userProfileKey);
  if (userProfileRaw) {
    try {
      const p: UserProfile = JSON.parse(userProfileRaw);
      p.status = decision;
      if (decision === "APPROVED") {
        p.role = role;
      } else {
        p.rejectionReason = reason;
      }
      localStorage.setItem(userProfileKey, JSON.stringify(p));
    } catch {}
  }

  // Update Firestore
  if (firestore) {
    try {
      await setDoc(
        doc(firestore, "registration_applications", applicationId),
        {
          status: decision,
          reviewedAt,
          reviewedBy: reviewerName,
          rejectionReason: reason || null,
        },
        { merge: true }
      );

      await setDoc(
        doc(firestore, "users", uid),
        decision === "APPROVED"
          ? { status: "APPROVED", role }
          : { status: "REJECTED", rejectionReason: reason || null },
        { merge: true }
      );
    } catch (e) {
      console.warn("[Firestore] Review update offline:", e);
    }
  }
}

export { signInWithPopup, firebaseSignOut };

