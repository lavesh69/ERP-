# 🔒 Free Development & Trial Firebase Authentication Guide

This document provides a step-by-step guide to configuring **100% Free Firebase Authentication** with **Google Sign-In**, **Email/Password**, and **Test Phone OTP Login** (Zero SMS Costs) for Classroom ERP.

---

## 💡 Core Principles & Cost Guarantee
1. **Zero SMS Cost**: Real SMS OTP services (Twilio, AWS SNS, Firebase live SMS) incur carrier charges per dispatch. This development/trial system uses **Firebase Native Test Phone Numbers**, which bypass SMS carrier routing entirely.
2. **No Paid Third-Party SMS Add-ons**: You do not need to register, configure, or pay for any SMS gateway or carrier registration.
3. **Realistic UX**: The test phone flow mirrors a live multi-factor SMS experience with international phone inputs, Recaptcha verifiers, 6-digit PIN boxes, countdown timers, and profile provisioning in Firestore.
4. **Vercel Hobby Deployable**: Zero native binary dependencies; fully compatible with Vercel Edge/Serverless environments.

---

## 🛠️ Step-by-Step Firebase Console Setup

### 1. Create a Firebase Project
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Project Name: `classroom-erp-trial` (or your preferred name).
4. Google Analytics: Optional (can be disabled for development).
5. Ensure your project is on the **Spark Plan** (100% Free).

---

### 2. Enable Google Sign-In
1. In the Firebase Console left menu, navigate to **Build** -> **Authentication**.
2. Click **Get started** if configuring for the first time.
3. In the **Sign-in method** tab, click **Google**.
4. Toggle **Enable**.
5. Set the **Project support email** (your Google account).
6. Click **Save**.
7. Navigate to **Authentication** -> **Settings** -> **Authorized domains**.
8. Ensure the following domains are listed:
   - `localhost`
   - `127.0.0.1`
   - `your-deployment-name.vercel.app` (add your Vercel URL when deploying)

---

### 3. Enable Email/Password Sign-In
1. In **Authentication** -> **Sign-in method**, click **Email/Password**.
2. Toggle **Enable** under "Email/Password".
3. Leave "Email link (passwordless sign-in)" disabled.
4. Click **Save**.

---

### 4. Configure Test Phone Numbers (Zero SMS Cost)
> ⚠️ **IMPORTANT**: Do NOT connect any paid SMS provider or use live unlisted phone numbers during development. Live phone numbers trigger real SMS routing and will prompt for billing.

1. In **Authentication** -> **Sign-in method**, click **Phone**.
2. Toggle **Enable**.
3. Under the toggle, locate the expandable section titled:  
   **"Phone numbers for testing (optional)"**.
4. Click **Add phone number**.
5. Add the following development test phone numbers with static 6-digit verification codes:
   - **Phone Number**: `+1 650-555-1234` | **Verification Code**: `123456`
   - **Phone Number**: `+91 99999 99999` | **Verification Code**: `123456`
   - **Phone Number**: `+1 650-555-4321` | **Verification Code**: `654321`
6. Click **Add**, then click **Save**.

**Why this works:** When Firebase Auth detects a registered test phone number, the client SDK immediately enters the OTP verification state without contacting SMS carriers. Entering the pre-configured 6-digit code signs the user in instantly at **$0.00 cost**.

---

### 5. Enable Cloud Firestore (User Profile Storage)
1. In the Firebase Console, navigate to **Build** -> **Firestore Database**.
2. Click **Create database**.
3. Location: Choose the region closest to your users (e.g. `us-central1` or `asia-south1`).
4. Security Rules: Choose **Start in test mode** for development or use the production rules below:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

### 6. Retrieve Web App Credentials
1. In the Firebase Console, click the **Gear icon (Project settings)** next to "Project Overview".
2. Under **General**, scroll down to **Your apps**.
3. Click the Web icon `</>` to register a web app.
4. App nickname: `Classroom Web ERP`.
5. Firebase Hosting: Leave unchecked. Click **Register app**.
6. Copy the values inside `firebaseConfig`.

---

## ⚙️ Environment Variables Configuration

In your project root `.env.local` (or in Vercel Project Settings -> Environment Variables), populate:

```ini
# Firebase Public Web Credentials
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="classroom-erp-trial.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="classroom-erp-trial"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="classroom-erp-trial.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789012"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789012:web:abcdef1234567890"

# Comma-separated test phone numbers and codes (matches Firebase Console testing numbers):
NEXT_PUBLIC_FIREBASE_TEST_PHONE_NUMBERS="+16505551234:123456,+919999999999:123456,+16505554321:654321"

# Application Session Keys
AUTH_SECRET="your-32-byte-secure-random-auth-secret-key"
JWT_SECRET="your-32-byte-secure-random-jwt-secret-key"
NEXT_PUBLIC_APP_URL="https://your-deployment.vercel.app"
```

---

## 🚀 Testing the Authentication Flow

### 1. Google Sign-In
- Click **Continue with Google**.
- Select your Google account in the popup.
- The system signs you in, writes your user record to Firestore `/users/{uid}`, establishes a secure `classroom_session` cookie, and redirects to your portal dashboard.

### 2. Email / Password
- Switch to the **Email** tab.
- Click "Need an account? Sign Up" to register a trial user, or sign in directly with an existing account.
- The session is established and persisted across refreshes.

### 3. Test Phone Numbers (Zero SMS OTP)
- Switch to the **Phone OTP** tab.
- Click any of the pre-filled test numbers (e.g. `+1 650-555-1234`).
- Click **Send Verification Code**.
- The UI immediately renders the 6-digit verification code input boxes with a 30s countdown.
- Enter `123456`.
- Click **Verify & Enter Portal**.
- The system verifies the code, syncs the phone record to Firestore, issues the session JWT, and unlocks protected routes.

### 4. Logout & Protected Routes
- Click the **Log Out** button in the top navigation bar.
- Firebase Auth signs out and the server session cookie is revoked.
- Attempting to navigate directly to `/admin`, `/timetable`, `/attendance`, or `/students` immediately redirects back to `/login?from=...`.
