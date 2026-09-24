import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import IdleSessionGuard from "@/components/auth/IdleSessionGuard";
export const metadata: Metadata = {
  title: "CLASSROOM — Autonomous Education ERP & Academic OS",
  description:
    "Production-grade, modern Education ERP combining College/University ERP, School ERP, LMS, SIS, and Autonomous AI Agents.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#8E5368",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8E5368" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="h-full bg-ivory-100 dark:bg-charcoal-950 text-charcoal-900 dark:text-ivory-100 antialiased selection:bg-rose-light selection:text-rose-primary transition-colors duration-200">
        <AppProvider>
          {children}
          <IdleSessionGuard />
        </AppProvider>
      </body>
    </html>
  );
}
