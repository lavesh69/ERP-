"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  getFirebaseAuth,
  googleProvider,
  getTestPhoneNumbers,
  createOrUpdateFirestoreProfile,
  isFirebaseConfigured,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  ConfirmationResult,
} from "@/lib/firebase/config";
import { signInWithPopup } from "firebase/auth";
import {
  Smartphone,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { UserRole } from "@/types/auth";
import { ROLE_CONFIGS } from "@/lib/auth/roles";

interface FirebaseAuthCardProps {
  onSuccessRedirect?: string;
}

export function FirebaseAuthCard({ onSuccessRedirect }: FirebaseAuthCardProps) {
  const router = useRouter();
  const { showToast, setAuthSession } = useApp();

  const [authMethod, setAuthMethod] = useState<"PHONE" | "GOOGLE" | "EMAIL">("PHONE");
  const [selectedRole, setSelectedRole] = useState<UserRole>("STUDENT");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone OTP Flow State
  const [phoneStep, setPhoneStep] = useState<"PHONE_INPUT" | "OTP_INPUT">("PHONE_INPUT");
  const [phoneNumber, setPhoneNumber] = useState("+1 650-555-1234");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [countdown, setCountdown] = useState<number>(30);
  const [isResendActive, setIsResendActive] = useState(false);

  // Email / Password State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const testPhoneNumbers = getTestPhoneNumbers();
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneStep === "OTP_INPUT" && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setIsResendActive(true);
    }
    return () => clearTimeout(timer);
  }, [phoneStep, countdown]);

  // Clean up recaptcha verifier
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
      }
    };
  }, []);

  const handlePostSession = async (payload: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    phoneNumber?: string | null;
    photoURL?: string | null;
    role: UserRole;
    providerId: string;
    isTestPhone?: boolean;
  }) => {
    const res = await fetch("/api/auth/firebase-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create application session");
    }

    // Save profile to Firestore
    await createOrUpdateFirestoreProfile(payload.uid, {
      uid: payload.uid,
      email: payload.email,
      displayName: payload.displayName || "Academic Scholar",
      phoneNumber: payload.phoneNumber,
      photoURL: payload.photoURL,
      role: payload.role,
      providerId: payload.providerId,
      isTestUser: payload.isTestPhone ?? false,
    });

    setAuthSession(data.user);
    showToast(`Authenticated as ${data.user.fullName}!`, "success");

    const target = onSuccessRedirect || ROLE_CONFIGS[data.user.role as UserRole]?.dashboardPath || "/";
    router.push(target);
    router.refresh();
  };

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const auth = getFirebaseAuth();
      if (!auth || !isFirebaseConfigured()) {
        // Fallback development trial mode when Firebase env keys are pending
        const mockUid = `google_dev_${Date.now()}`;
        await handlePostSession({
          uid: mockUid,
          email: "scholar.google@trial.classroom.edu",
          displayName: "Google Trial Scholar",
          photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop",
          role: selectedRole,
          providerId: "google.com",
        });
        return;
      }

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await handlePostSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        role: selectedRole,
        providerId: "google.com",
      });
    } catch (err: any) {
      console.error("Google Auth error:", err);
      // If popup closed or domain unverified, show informative message
      if (err.code === "auth/popup-closed-by-user") {
        setErrorMessage("Google Sign-In was cancelled.");
      } else if (err.code === "auth/unauthorized-domain") {
        setErrorMessage(
          "Current domain is not authorized in Firebase Console -> Authentication -> Settings -> Authorized domains."
        );
      } else {
        setErrorMessage(err.message || "Google Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email / Password Sign-In & Sign-Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth || !isFirebaseConfigured()) {
        // Fallback trial mode
        const mockUid = `email_dev_${Date.now()}`;
        await handlePostSession({
          uid: mockUid,
          email,
          displayName: displayName || email.split("@")[0],
          role: selectedRole,
          providerId: "password",
        });
        return;
      }

      let user;
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        user = cred.user;
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        user = cred.user;
      }

      await handlePostSession({
        uid: user.uid,
        email: user.email,
        displayName: displayName || user.displayName || email.split("@")[0],
        role: selectedRole,
        providerId: "password",
      });
    } catch (err: any) {
      console.error("Email auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setErrorMessage("Invalid email or password.");
      } else if (err.code === "auth/email-already-in-use") {
        setErrorMessage("An account with this email already exists. Try signing in.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("Password should be at least 6 characters.");
      } else {
        setErrorMessage(err.message || "Email authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone OTP Flow (Zero SMS - Using Firebase Test Phone Numbers)
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.trim().replace(/\s+/g, "");
    if (!cleanNumber.startsWith("+") || cleanNumber.length < 8) {
      setErrorMessage("Please enter a valid international phone number starting with '+' (e.g. +16505551234 or +919999999999).");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth || !isFirebaseConfigured()) {
        // Fallback local trial mode: simulated test phone OTP
        setPhoneStep("OTP_INPUT");
        setCountdown(30);
        setIsResendActive(false);
        showToast("Test OTP code sent! Use code 123456 for test numbers.", "info");
        return;
      }

      // Initialize RecaptchaVerifier
      if (!recaptchaVerifierRef.current && recaptchaContainerRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          size: "invisible",
          callback: () => {},
        });
      }

      const appVerifier = recaptchaVerifierRef.current;
      if (!appVerifier) {
        throw new Error("Recaptcha verifier could not be initialized");
      }

      const confirmation = await signInWithPhoneNumber(auth, cleanNumber, appVerifier);
      setConfirmationResult(confirmation);
      setPhoneStep("OTP_INPUT");
      setCountdown(30);
      setIsResendActive(false);
      showToast("Verification code dispatched (Test phone mode active)", "info");
    } catch (err: any) {
      console.error("Phone OTP send error:", err);
      // If recaptcha expired or error, reset verifier
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch {}
      }

      // Check if it's billing or quota error - reinforce that test numbers avoid SMS charges
      if (err.code === "auth/billing-not-enabled") {
        setErrorMessage(
          "Firebase Phone Auth requires testing numbers for zero-cost mode. Add your test number in Firebase Console -> Authentication -> Sign-in method -> Phone -> Phone numbers for testing."
        );
      } else if (err.code === "auth/invalid-phone-number") {
        setErrorMessage("Invalid phone number format. Must include country code like +1 or +91.");
      } else {
        setErrorMessage(err.message || "Failed to send verification code");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join("");
    if (enteredOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const auth = getFirebaseAuth();
      if (!auth || !isFirebaseConfigured() || !confirmationResult) {
        // Fallback local trial assertion: check against configured test codes
        const cleanNumber = phoneNumber.trim().replace(/\s+/g, "");
        const matchedTest = testPhoneNumbers.find(
          (t) => t.phoneNumber.replace(/\s+/g, "") === cleanNumber
        );
        const expectedCode = matchedTest?.testCode || "123456";

        if (enteredOtp !== expectedCode && enteredOtp !== "123456") {
          setErrorMessage(`Invalid verification code. For test number ${cleanNumber}, use code ${expectedCode}`);
          setIsLoading(false);
          return;
        }

        const mockUid = `phone_dev_${cleanNumber.replace(/[^0-9]/g, "")}`;
        await handlePostSession({
          uid: mockUid,
          phoneNumber: cleanNumber,
          displayName: `Mobile Scholar (${cleanNumber.slice(-4)})`,
          role: selectedRole,
          providerId: "phone",
          isTestPhone: true,
        });
        return;
      }

      // Live Firebase confirmationResult verification
      const userCredential = await confirmationResult.confirm(enteredOtp);
      const user = userCredential.user;

      await handlePostSession({
        uid: user.uid,
        phoneNumber: user.phoneNumber || phoneNumber,
        displayName: user.displayName || `Scholar (${(user.phoneNumber || phoneNumber).slice(-4)})`,
        role: selectedRole,
        providerId: "phone",
        isTestPhone: true,
      });
    } catch (err: any) {
      console.error("OTP verification error:", err);
      if (err.code === "auth/invalid-verification-code") {
        setErrorMessage("Invalid 6-digit verification code. Please check and try again.");
      } else if (err.code === "auth/code-expired") {
        setErrorMessage("Verification code expired. Please request a new code.");
      } else {
        setErrorMessage(err.message || "Verification failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      setOtpDigits(pasteData.split(""));
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E191C] rounded-3xl p-6 sm:p-8 border border-border dark:border-charcoal-800 shadow-elevated">
      {/* Invisible Recaptcha container */}
      <div ref={recaptchaContainerRef} id="recaptcha-container" />

      {/* Trial Banner */}
      <div className="mb-6 p-3 rounded-2xl bg-rose-container/50 dark:bg-rose-dark/20 border border-rose-accent/30 flex items-start gap-2.5">
        <Sparkles className="h-4 w-4 text-rose-primary dark:text-rose-accent shrink-0 mt-0.5" />
        <div className="text-xs text-charcoal-700 dark:text-ivory-200">
          <span className="font-bold text-rose-primary dark:text-rose-accent">
            Free Development / Trial Authentication
          </span>
          <p className="text-[11px] text-charcoal-600 dark:text-charcoal-400 mt-0.5">
            Zero SMS Cost • Native Firebase Auth • Google Sign-In • Email & Test Phone OTP
          </p>
        </div>
      </div>

      {/* Method Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-ivory-100 dark:bg-charcoal-900 rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setAuthMethod("PHONE");
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            authMethod === "PHONE"
              ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
              : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
          }`}
        >
          <Smartphone className="h-3.5 w-3.5" />
          <span>Phone OTP</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMethod("GOOGLE");
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            authMethod === "GOOGLE"
              ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
              : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
          }`}
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Google</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMethod("EMAIL");
            setErrorMessage(null);
          }}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            authMethod === "EMAIL"
              ? "bg-white dark:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 shadow-sm"
              : "text-charcoal-600 dark:text-charcoal-400 hover:text-charcoal-900 dark:hover:text-ivory-200"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Email</span>
        </button>
      </div>

      {/* Target Academic Role Selection */}
      <div className="mb-5">
        <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1.5">
          Assign Academic Perspective
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["STUDENT", "FACULTY", "PARENT"] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                selectedRole === role
                  ? "bg-rose-primary text-white border-rose-primary shadow-sm shadow-rose-primary/20"
                  : "bg-ivory-50 dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-300 border-border dark:border-charcoal-800 hover:bg-ivory-100"
              }`}
            >
              {role === "STUDENT" ? "Scholar" : role === "FACULTY" ? "Faculty" : "Parent"}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-academic-danger-subtle dark:bg-red-950/40 border border-academic-danger/30 text-academic-danger text-xs flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. GOOGLE SIGN-IN VIEW */}
      {authMethod === "GOOGLE" && (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
            Authenticate with your authorized Google account. Firebase will verify identity and provision your role automatically.
          </p>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white dark:bg-charcoal-900 border border-border dark:border-charcoal-700 hover:bg-ivory-50 dark:hover:bg-charcoal-800 text-charcoal-900 dark:text-ivory-100 font-bold text-xs shadow-sm transition-all active:scale-[0.99]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? "Authenticating with Google..." : "Continue with Google"}</span>
          </button>
        </div>
      )}

      {/* 2. EMAIL / PASSWORD VIEW */}
      {authMethod === "EMAIL" && (
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3.5">
          {isSignUp && (
            <div>
              <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Dr. Marie Curie"
                className="w-full text-xs p-2.5 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@trial.classroom.edu"
                className="w-full text-xs p-2.5 pl-8 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
              <Mail className="h-4 w-4 text-charcoal-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs p-2.5 pl-8 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100"
              />
              <Lock className="h-4 w-4 text-charcoal-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 px-4 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? "Processing..." : isSignUp ? "Create Trial Account" : "Sign In with Email"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage(null);
              }}
              className="text-xs text-rose-primary dark:text-rose-accent hover:underline font-semibold"
            >
              {isSignUp ? "Already registered? Sign In" : "Need an account? Sign Up"}
            </button>
          </div>
        </form>
      )}

      {/* 3. PHONE OTP (TEST NUMBERS) VIEW */}
      {authMethod === "PHONE" && (
        <div>
          {phoneStep === "PHONE_INPUT" ? (
            <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-charcoal-700 dark:text-charcoal-300 block mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 650-555-1234"
                    className="w-full text-xs p-2.5 pl-8 rounded-xl border border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 font-mono"
                  />
                  <Smartphone className="h-4 w-4 text-charcoal-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Development Test Phone Number Quick Selectors */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-charcoal-600 dark:text-charcoal-400 flex items-center gap-1">
                    <Info className="h-3 w-3 text-academic-primary" />
                    Trial / Dev Test Numbers (Zero SMS Cost):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {testPhoneNumbers.map((t) => (
                    <button
                      key={t.phoneNumber}
                      type="button"
                      onClick={() => setPhoneNumber(t.phoneNumber)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-all ${
                        phoneNumber === t.phoneNumber
                          ? "bg-rose-container text-rose-primary border-rose-primary/40 font-bold"
                          : "bg-ivory-50 dark:bg-charcoal-900 text-charcoal-700 dark:text-charcoal-400 border-border dark:border-charcoal-700 hover:bg-ivory-100"
                      }`}
                    >
                      {t.phoneNumber} (Code: {t.testCode})
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Requesting OTP..." : "Send Verification Code"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="text-center">
                <span className="text-xs text-charcoal-600 dark:text-charcoal-400">
                  Enter the 6-digit code dispatched to
                </span>
                <div className="font-mono font-bold text-xs text-charcoal-900 dark:text-ivory-100 mt-0.5">
                  {phoneNumber}
                </div>
              </div>

              {/* 6-Digit OTP Box Grid */}
              <div className="flex justify-center gap-2 my-2" onPaste={handlePasteOtp}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border-2 border-border dark:border-charcoal-700 bg-white dark:bg-charcoal-900 text-charcoal-900 dark:text-ivory-100 focus:border-rose-primary focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join("").length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-primary hover:bg-rose-dark active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-rose-primary/20 transition-all flex items-center justify-center gap-2"
              >
                <span>{isLoading ? "Verifying..." : "Verify & Enter Portal"}</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep("PHONE_INPUT");
                    setOtpDigits(["", "", "", "", "", ""]);
                    setErrorMessage(null);
                  }}
                  className="text-charcoal-500 hover:text-charcoal-800 dark:hover:text-ivory-200"
                >
                  Change Number
                </button>

                {countdown > 0 ? (
                  <span className="text-charcoal-400 text-[11px]">Resend in {countdown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={!isResendActive}
                    className="text-rose-primary dark:text-rose-accent font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
