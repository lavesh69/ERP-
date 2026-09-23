# CLASSROOM Academic OS — Production Web Application

> **Production-Ready Academic Portal & ERP** built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, powered by **Firebase Authentication (Google Sign-In)** and **Cloud Firestore**, pre-configured for free **Vercel Hobby** deployment.

---

## 🚀 Key Highlights & Stack

- **Frontend Core**: React 18, TypeScript, Vite 6
- **Styling & UI**: Tailwind CSS (Ivory Bloom & Deep Rose Design System, Dark Mode, Lucide Icons)
- **Authentication**: Firebase Authentication with `GoogleAuthProvider`
  - Persistent authentication across browser refreshes (`onAuthStateChanged`)
  - Protected routes (`/dashboard`, `/courses`, `/timetable`, `/profile`)
  - Automatic redirect to intended page after login
  - User profile display (Google avatar, verified name, email, Firebase UID, provider ID)
  - Popup error handling with descriptive user alerts
  - Zero stored passwords, zero OAuth secret exposure, zero private service accounts in frontend bundle
- **Database**: Cloud Firestore (Real-time Academic Notices & Course Catalog)
- **Deployment Target**: Vercel Hobby (100% Free CDN edge hosting with client-side SPA routing)
- **Zero Paid Dependencies**: 0 paid SMS, 0 paid Google Maps APIs, 0 subscription third-party locks.

---

## 📁 Repository Structure

```
classroom-web/
├── dist/                     # Optimized static production build (tsc && vite build)
├── public/                   # Static assets & academic icon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx   # Route protection with loading skeletons
│   │   └── layout/
│   │       └── AppLayout.tsx        # Responsive navbar, role badge, theme toggle
│   ├── context/
│   │   └── AuthContext.tsx          # Firebase Auth listener & user profile sync
│   ├── lib/
│   │   └── firebase.ts              # Firebase initialization & Firestore fallback
│   ├── pages/
│   │   ├── LoginPage.tsx            # Google Sign-In with role selector
│   │   ├── DashboardPage.tsx        # Academic overview & real-time notices
│   │   ├── CoursesPage.tsx          # Filterable course catalog & enrollments
│   │   ├── TimetablePage.tsx        # Weekly class schedule & print support
│   │   └── ProfilePage.tsx          # Verified Google profile, role switch & logout
│   ├── types/
│   │   └── index.ts                 # Full TypeScript interfaces & roles
│   ├── App.tsx                      # Router and route configurations
│   ├── index.css                    # Tailwind CSS directives & theme rules
│   ├── main.tsx                     # React DOM root entrypoint
│   └── vite-env.d.ts                # Vite environment typings
├── .env.example                     # Environment template
├── firestore.rules                  # Security rules for production Cloud Firestore
├── index.html                       # HTML5 entry with Inter font
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # Strict TypeScript configuration
├── vercel.json                      # Vercel Hobby SPA rewrite & security headers
└── vite.config.ts                   # Vite bundler configuration with alias '@'
```

---

## 🛠️ Step 1: Firebase Project Setup

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and give it a name (e.g. `classroom-academic-os`).
3. (Optional) Disable Google Analytics or enable free Spark tier analytics.

### 2. Enable Google Sign-In
1. In the Firebase Console left sidebar, go to **Build** → **Authentication**.
2. Click **Get Started** if you haven't enabled it yet.
3. In the **Sign-in method** tab, click **Add new provider** and select **Google**.
4. Toggle **Enable**.
5. Select your project support email and click **Save**.

### 3. Add Authorized Domains for Google OAuth
In **Authentication** → **Settings** → **Authorized domains**:
- `localhost` (added by default for local testing)
- Add your Vercel domain once deployed: `<your-app-name>.vercel.app`

### 4. Create Cloud Firestore Database
1. Go to **Build** → **Firestore Database**.
2. Click **Create Database**.
3. Choose **Start in production mode** and select your closest server region (e.g. `us-central1`).
4. Go to the **Rules** tab and paste the contents of `firestore.rules` included in this repository:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /courses/{courseId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN'];
    }
    match /announcements/{announcementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.role in ['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY'];
    }
  }
}
```
5. Click **Publish**.

### 5. Obtain Firebase Web App Configuration Keys
1. In Firebase Console, click the **Settings Gear** ⚙️ → **Project settings**.
2. Under the **General** tab, scroll down to **Your apps** and click the **Web** (`</>`) icon.
3. Register the app nickname (e.g. `classroom-web`).
4. Copy the `firebaseConfig` object values.

---

## 💻 Step 2: Local Development Setup

1. **Clone & Navigate**:
   ```bash
   git clone <repo-url>
   cd classroom-web
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (copied from `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

   > 💡 *Note: If run without API keys, the application automatically boots in Trial / Development Mode with full mock authentication so you can evaluate the UI, routing, and workflows instantly.*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **Run Production Build Verification**:
   ```bash
   npm run build
   ```
   Ensures zero TypeScript errors and compiles optimized assets into `dist/`.

---

## ☁️ Step 3: Deploy to Vercel Hobby (Free Tier)

### Method A: Deploy via Vercel CLI (Quickest)
1. Install Vercel CLI globally (if not already installed):
   ```bash
   npm i -g vercel
   ```
2. Log in and deploy:
   ```bash
   vercel
   ```
3. Set your production environment variables when prompted or through the Vercel dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Method B: Deploy via GitHub + Vercel Web Dashboard
1. Push this project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial production-ready academic portal"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Click **Import Project** and select your GitHub repository.
4. Framework Preset will automatically detect **Vite**.
5. Under **Environment Variables**, paste the `VITE_FIREBASE_*` keys from your `.env` file.
6. Click **Deploy**.

### ⚠️ Crucial Step Post-Deployment:
Copy your newly assigned Vercel URL (e.g. `https://classroom-web-xyz.vercel.app`) and add it to **Firebase Console → Authentication → Settings → Authorized domains**.

---

## 🔒 Security & Privacy Guarantees

1. **Zero Secret Leaks**: No Google OAuth secrets, Google passwords, or Firebase admin service-account JSON keys are stored or referenced in frontend client code.
2. **SPA Fallback with Security Headers**: `vercel.json` applies strict HTTP security headers:
   - `X-Frame-Options: DENY` (Clickjacking prevention)
   - `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - Production rewrite rule forwarding all subpaths to `/index.html` for clean React Router reloads.
3. **Database Guardrails**: Firestore security rules restrict write operations so users can only modify their own profile record.

---

## 📜 License
Apache-2.0 / MIT. Free for educational and institutional use.
