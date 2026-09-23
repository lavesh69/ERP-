import React, { createContext, useContext, useState, useEffect } from "react";
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import {
  getFirebaseAuth,
  googleProvider,
  createOrUpdateFirestoreProfile,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  signInWithGoogle: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");

  // Persistent authentication state listener
  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth || !isFirebaseConfigured()) {
      // Check local storage for mock/trial development session
      const savedTrialUser = localStorage.getItem("classroom_trial_session");
      if (savedTrialUser) {
        try {
          const parsed = JSON.parse(savedTrialUser);
          setProfile(parsed);
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.displayName,
            photoURL: parsed.photoURL,
          } as FirebaseUser);
        } catch {}
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProfile = await createOrUpdateFirestoreProfile(currentUser, selectedRole);
          setProfile(userProfile);
        } catch (err) {
          console.error("Error synchronizing profile:", err);
        }
      } else {
        setProfile(null);
        localStorage.removeItem("classroom_trial_session");
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedRole]);

  const clearError = () => setError(null);

  // 1. Google Sign-In with robust popup/redirect error handling
  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    setIsLoading(true);
    setError(null);

    const auth = getFirebaseAuth();

    if (!auth || !isFirebaseConfigured()) {
      // Development Trial Mode: Instant mock Google authentication
      console.info("[Trial Auth] Firebase credentials pending. Launching local trial Google session.");
      const mockProfile: UserProfile = {
        uid: `goog_trial_${Date.now()}`,
        email: "scholar.google@apex.edu",
        displayName: "Ada Lovelace",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop",
        role: selectedRole,
        status: "APPROVED",
        providerId: "google.com",
        institutionId: "APEX-MAIN",
        institutionName: "Apex Institute of Science & Technology",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isTestUser: true,
      };

      localStorage.setItem("classroom_trial_session", JSON.stringify(mockProfile));
      setProfile(mockProfile);
      setUser({
        uid: mockProfile.uid,
        email: mockProfile.email,
        displayName: mockProfile.displayName,
        photoURL: mockProfile.photoURL,
      } as FirebaseUser);

      setIsLoading(false);
      return mockProfile;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userProfile = await createOrUpdateFirestoreProfile(result.user, selectedRole);
      setProfile(userProfile);
      return userProfile;
    } catch (err: any) {
      console.error("[Google Auth Error]:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. The Google popup was closed before completing.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError(
          "Current domain is not authorized. In Firebase Console -> Authentication -> Settings -> Authorized domains, add this domain."
        );
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error connecting to Google Authentication. Please check your internet connection.");
      } else {
        setError(err.message || "Failed to authenticate with Google. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Production Logout
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
      localStorage.removeItem("classroom_trial_session");
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Update Academic Role
  const updateRole = async (newRole: UserRole) => {
    setSelectedRole(newRole);
    if (profile && user) {
      const updatedProfile: UserProfile = { ...profile, role: newRole };
      setProfile(updatedProfile);
      localStorage.setItem(`classroom_user_profile_${user.uid}`, JSON.stringify(updatedProfile));
      await createOrUpdateFirestoreProfile(user, newRole).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        error,
        selectedRole,
        setSelectedRole,
        signInWithGoogle,
        logout,
        updateRole,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
