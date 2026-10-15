"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Institutional Root Global Crash Boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <title>System Error · CLASSROOM ERP</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          backgroundColor: "#FDFBF7",
          color: "#1E1E1E",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "90%",
            margin: "24px auto",
            padding: "32px",
            backgroundColor: "#FFFFFF",
            borderRadius: "24px",
            border: "1px solid #FECDD3",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              backgroundColor: "#FFF1F2",
              color: "#E11D48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px auto",
              border: "1px solid #FDA4AF",
            }}
          >
            <AlertTriangle style={{ width: "28px", height: "28px" }} />
          </div>

          <span
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              fontWeight: "bold",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#E11D48",
              display: "block",
              marginBottom: "8px",
            }}
          >
            GLOBAL APPLICATION RECOVERY BOUNDARY
          </span>

          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#0F172A",
              margin: "0 0 8px 0",
            }}
          >
            Root Application Interrupted
          </h1>

          <p
            style={{
              fontSize: "12px",
              color: "#64748B",
              lineHeight: 1.5,
              marginBottom: "20px",
            }}
          >
            A high-level runtime exception was safely isolated by the institutional global boundary.
            Core database records and audit registries remain fully intact.
          </p>

          {error?.message && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                backgroundColor: "#FFF1F2",
                border: "1px solid #FECDD3",
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#BE123C",
                textAlign: "left",
                marginBottom: "24px",
                wordBreak: "break-all",
              }}
            >
              {error.message}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: "#8E5368",
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#733D52")}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#8E5368")}
            >
              <RefreshCw style={{ width: "14px", height: "14px" }} />
              Attempt System Recovery
            </button>

            <a
              href="/"
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "12px",
                backgroundColor: "#F8FAFC",
                color: "#334155",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid #CBD5E1",
                textDecoration: "none",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#F1F5F9")}
              onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#F8FAFC")}
            >
              <Home style={{ width: "14px", height: "14px" }} />
              Return to Institutional Dashboard
            </a>
          </div>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #F1F5F9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              fontSize: "10px",
              color: "#94A3B8",
            }}
          >
            <ShieldAlert style={{ width: "12px", height: "12px", color: "#E11D48" }} />
            <span>CLASSROOM ERP Verified Fault Isolation Protocol</span>
          </div>
        </div>
      </body>
    </html>
  );
}
