import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { UserRole } from "@/types";

interface AppLayoutProps {
  children?: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, profile, logout, updateRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const isAdmin = profile?.role === "INSTITUTION_ADMIN" || profile?.role === "SUPER_ADMIN";

  const navLinks = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Courses", path: "/courses", icon: BookOpen },
    { label: "Timetable", path: "/timetable", icon: Calendar },
    ...(isAdmin ? [{ label: "Approvals", path: "/admin/approvals", icon: ShieldCheck }] : []),
    { label: "Profile", path: "/profile", icon: User },
  ];

  const roles: { role: UserRole; label: string }[] = [
    { role: "STUDENT", label: "Scholar" },
    { role: "FACULTY", label: "Faculty" },
    { role: "INSTITUTION_ADMIN", label: "Administrator" },
    { role: "PARENT", label: "Guardian" },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-charcoal-900/80 backdrop-blur-md border-b border-rose-light/50 dark:border-charcoal-800 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="h-10 w-10 rounded-2xl bg-rose-primary text-white flex items-center justify-center shadow-md shadow-rose-primary/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-base tracking-tight text-charcoal-900 dark:text-ivory-100 leading-tight">
                  CLASSROOM
                </span>
                <span className="text-[10px] text-rose-primary dark:text-rose-accent font-semibold tracking-wider uppercase">
                  Academic OS
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-rose-container dark:bg-rose-dark/30 text-rose-primary dark:text-rose-accent shadow-xs"
                      : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-100 hover:bg-ivory-200/50 dark:hover:bg-charcoal-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Controls & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-200 dark:hover:bg-charcoal-800 transition-colors"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Academic Role Switcher */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                aria-label="Change academic role perspective"
                aria-expanded={isRoleDropdownOpen}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-light dark:border-charcoal-700 bg-ivory-50 dark:bg-charcoal-800 text-xs font-semibold text-charcoal-700 dark:text-ivory-200 hover:bg-white transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-academic-success animate-pulse" />
                <span>{profile?.role || "STUDENT"}</span>
                <ChevronDown className="h-3 w-3 text-charcoal-400" />
              </button>

              {isRoleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-charcoal-800 border border-border dark:border-charcoal-700 shadow-elevated py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                    Perspective Switcher
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        updateRole(r.role);
                        setIsRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                        profile?.role === r.role
                          ? "bg-rose-container text-rose-primary dark:bg-rose-dark/30 dark:text-rose-accent"
                          : "text-charcoal-700 dark:text-ivory-200 hover:bg-ivory-100 dark:hover:bg-charcoal-700"
                      }`}
                    >
                      <span>{r.label}</span>
                      {profile?.role === r.role && <span className="text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Thumbnail */}
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-ivory-50 dark:bg-charcoal-800 border border-rose-light/70 dark:border-charcoal-700 hover:border-rose-primary transition-all group"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="h-7 w-7 rounded-full object-cover border border-rose-primary/20"
                />
              ) : (
                <div className="h-7 w-7 rounded-full bg-rose-primary text-white text-xs font-bold flex items-center justify-center">
                  {(profile?.displayName || "S")[0].toUpperCase()}
                </div>
              )}
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 leading-none group-hover:text-rose-primary transition-colors">
                  {profile?.displayName?.split(" ")[0] || "Scholar"}
                </span>
                <span className="text-[10px] text-charcoal-400 leading-none mt-0.5">
                  {profile?.role}
                </span>
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:text-academic-danger hover:bg-rose-50 dark:hover:bg-charcoal-800 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-charcoal-600 dark:text-charcoal-300 hover:bg-ivory-200 dark:hover:bg-charcoal-800"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-rose-light/50 dark:border-charcoal-800 bg-white dark:bg-charcoal-900 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? "bg-rose-container text-rose-primary dark:bg-rose-dark/30 dark:text-rose-accent"
                      : "text-charcoal-700 dark:text-charcoal-300 hover:bg-ivory-100 dark:hover:bg-charcoal-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Mobile Perspective Switcher */}
            <div className="pt-3 mt-2 border-t border-rose-light/40 dark:border-charcoal-800">
              <span className="block px-3 text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-2">
                Active Perspective
              </span>
              <div className="grid grid-cols-2 gap-1.5 px-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      updateRole(r.role);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold text-center transition-colors ${
                      profile?.role === r.role
                        ? "bg-rose-container text-rose-primary dark:bg-rose-dark/40 dark:text-rose-accent border border-rose-accent/30"
                        : "text-charcoal-600 dark:text-charcoal-400 hover:bg-ivory-100 dark:hover:bg-charcoal-800 border border-transparent"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children || <Outlet />}
      </main>

      {/* Footer */}
      <footer className="border-t border-rose-light/40 dark:border-charcoal-800 py-6 text-center text-xs text-charcoal-500">
        <p>
          CLASSROOM Academic OS • Production Firebase Authentication & Cloud Firestore • Vercel Hobby
        </p>
      </footer>
    </div>
  );
}
