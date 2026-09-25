"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, SessionUser } from "@/types/auth";
import { MOCK_USERS, ROLE_CONFIGS } from "@/lib/auth/roles";

import { getFirebaseAuth, firebaseSignOut } from "@/lib/firebase/config";

interface Toast {
  id: string;
  type: "success" | "warning" | "danger" | "info" | "error";
  message: string;
}

export type ThemeMode = "light" | "dark";

interface AppContextType {
  currentUser: SessionUser;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  setAuthSession: (user: SessionUser) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  theme: ThemeMode;
  toggleTheme: () => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAIChatOpen: boolean;
  setIsAIChatOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (message: string, type?: "success" | "warning" | "danger" | "info" | "error") => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRoleState] = useState<UserRole>("SUPER_ADMIN");
  const [currentUser, setCurrentUser] = useState<SessionUser>(MOCK_USERS.SUPER_ADMIN);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(3);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Restore authenticated session from verified JWT cookie on mount
  useEffect(() => {
    async function hydrateSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentRoleState(data.user.role);
            setCurrentUser(data.user);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsAuthLoading(false);
      }
    }
    hydrateSession();
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("classroom_theme") as ThemeMode | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const nextTheme = prev === "light" ? "dark" : "light";
      localStorage.setItem("classroom_theme", nextTheme);
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      showToast(`Switched to ${nextTheme.toUpperCase()} mode`, "info");
      return nextTheme;
    });
  };

  const setAuthSession = (user: SessionUser) => {
    setCurrentUser(user);
    setCurrentRoleState(user.role);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(MOCK_USERS.GUEST);
      setCurrentRoleState("GUEST");
      showToast("Signed out successfully", "info");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  };

  // Sync Firebase onAuthStateChanged for cross-tab and session continuity
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      if (fbUser && !isAuthenticated) {
        // Firebase user authenticated
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Connect to SSE stream for live real-time notifications across all tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/realtime/events");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ANNOUNCEMENT_BROADCAST") {
            showToast(`Broadcast Notice: ${payload.title}`, "info");
            setUnreadNotificationsCount((prev) => prev + 1);
            setRefreshTrigger((prev) => prev + 1);
          } else if (payload.type === "ATTENDANCE_SESSION_STARTED") {
            showToast(`Live Class: Attendance opened for ${payload.courseCode}`, "warning");
            setRefreshTrigger((prev) => prev + 1);
          }
        } catch {}
      };
      eventSource.onerror = () => {
        // SSE automatically reconnects according to browser specification
      };
    } catch (e) {
      console.warn("SSE connection error:", e);
    }
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  const setCurrentRole = (role: UserRole) => {
    setCurrentRoleState(role);
    setCurrentUser(MOCK_USERS[role] || MOCK_USERS.SUPER_ADMIN);
    showToast(`Perspective switched: ${ROLE_CONFIGS[role]?.displayName || role}`, "info");
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const showToast = (
    message: string,
    type: "success" | "warning" | "danger" | "info" | "error" = "success"
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Keyboard shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        setAuthSession,
        logout,
        isAuthenticated,
        isAuthLoading,
        theme,
        toggleTheme,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAIChatOpen,
        setIsAIChatOpen,
        toasts,
        showToast,
        refreshTrigger,
        triggerRefresh,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-elevated border text-xs font-bold transition-all transform animate-in slide-in-from-bottom-2 ${
              toast.type === "success"
                ? "bg-academic-success text-white border-green-700"
                : toast.type === "warning"
                ? "bg-academic-warning text-white border-amber-600"
                : toast.type === "danger" || toast.type === "error"
                ? "bg-academic-danger text-white border-rose-700"
                : "bg-rose-primary text-white border-rose-900"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
