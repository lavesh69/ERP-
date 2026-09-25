"use client";

import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import {
  Camera,
  X,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MapPin,
  Bluetooth,
  ShieldCheck,
  Smartphone,
  Eye,
  Scan,
} from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: any) => void;
  expectedSessionId?: string;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onSuccess,
  expectedSessionId,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [cameraState, setCameraState] = useState<"IDLE" | "REQUESTING" | "ACTIVE" | "DENIED" | "UNSUPPORTED">("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Geolocation state
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [geoState, setGeoState] = useState<"IDLE" | "FETCHING" | "GRANTED" | "DENIED" | "UNAVAILABLE">("IDLE");

  // Web Bluetooth state
  const [bleSupported, setBleSupported] = useState<boolean>(false);
  const [bleState, setBleState] = useState<"UNSUPPORTED" | "IDLE" | "SCANNING" | "CONNECTED" | "FAILED">("IDLE");
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleChallengeToken, setBleChallengeToken] = useState<string | null>(null);

  // Check hardware capabilities on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasBle = "bluetooth" in navigator;
      setBleSupported(hasBle);
      if (!hasBle) {
        setBleState("UNSUPPORTED");
      }
    }
  }, []);

  // Capture Geolocation
  const requestLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoState("UNAVAILABLE");
      return;
    }

    setGeoState("FETCHING");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setGeoState("GRANTED");
      },
      (err) => {
        console.warn("Geolocation access denied or unavailable:", err.message);
        setGeoState("DENIED");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Start Camera Stream
  const startCamera = async () => {
    setErrorMessage(null);
    setCameraState("REQUESTING");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState("UNSUPPORTED");
      setErrorMessage("Camera access is not supported by your browser or insecure connection (HTTPS required).");
      return;
    }

    try {
      // Prefer rear environment camera
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraState("ACTIVE");
        startScanningLoop();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraState("DENIED");
        setErrorMessage("Camera permission was denied. Please allow camera access in your browser settings.");
      } else {
        setCameraState("UNSUPPORTED");
        setErrorMessage(`Could not start video stream: ${err.message || "Unknown hardware error"}`);
      }
    }
  };

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState("IDLE");
  };

  // Scanning loop
  const startScanningLoop = () => {
    let lastScanTime = 0;

    const tick = () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }

      const now = Date.now();
      // Scan every 200ms to preserve battery while maintaining rapid responsiveness
      if (now - lastScanTime >= 200 && !isVerifying && !scanResult) {
        lastScanTime = now;

        const video = videoRef.current;
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data && code.data.startsWith("APX_ATT_V2")) {
            handleCodeScanned(code.data);
            return;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  };

  // Connect Web Bluetooth
  const connectClassroomBluetooth = async () => {
    const nav = navigator as any;
    if (!nav.bluetooth) {
      setBleState("UNSUPPORTED");
      return;
    }

    try {
      setBleState("SCANNING");
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["generic_access", "0000ffe0-0000-1000-8000-00805f9b34fb"],
      });

      setBleDeviceName(device.name || "Classroom BLE Beacon");
      setBleState("CONNECTED");

      // Generate local client BLE handshake reference
      setBleChallengeToken(`BLE_CLIENT_DETECTED_${Date.now()}`);
    } catch (err: any) {
      console.warn("BLE Pairing cancelled or failed:", err);
      setBleState("FAILED");
    }
  };

  // Handle scanned token
  const handleCodeScanned = async (tokenString: string) => {
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        token: tokenString,
        sessionId: expectedSessionId,
      };

      if (geoCoords) {
        payload.latitude = geoCoords.latitude;
        payload.longitude = geoCoords.longitude;
        payload.accuracy = geoCoords.accuracy;
      }

      if (bleChallengeToken) {
        payload.bleChallenge = bleChallengeToken;
      }

      const res = await fetch("/api/attendance/qr/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Attendance verification failed");
      }

      setScanResult(data);
      stopCamera();
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify attendance token");
      // Allow re-scanning after 3 seconds on failure
      setTimeout(() => {
        setIsVerifying(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setErrorMessage(null);
      requestLocation();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Smart Attendance Scanner</h3>
              <p className="text-xs text-slate-400">Real-Time Camera & Verification</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex flex-col items-center">
          {scanResult ? (
            /* Success Card: Digital Attendance Receipt */
            <div className="w-full flex flex-col items-center py-2 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-xl font-bold text-white mb-1">
                {scanResult.alreadyMarked ? "Already Verified!" : "Attendance Marked!"}
              </h4>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                {scanResult.message || "Your attendance record has been cryptographically confirmed on the academic ledger."}
              </p>

              {/* Digital Receipt Card */}
              <div className="w-full bg-slate-950/70 border border-slate-700/60 rounded-2xl p-4 text-left space-y-2.5 mb-5 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Digital Receipt</span>
                  <span className="font-mono text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    {scanResult.receipt?.receiptId || `REC-${(scanResult.record?.id || "OK").slice(-8).toUpperCase()}`}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Student:</span>
                  <span className="font-semibold text-white">
                    {scanResult.student?.name} <span className="text-slate-400 font-normal">({scanResult.student?.rollNumber})</span>
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Course:</span>
                  <span className="font-semibold text-indigo-300 truncate max-w-[200px]">
                    {scanResult.course?.code} - {scanResult.course?.title}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="font-medium text-slate-300">
                    {scanResult.receipt?.date || scanResult.session?.date || "Today"} • {scanResult.receipt?.time || "Verified"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                    (scanResult.receipt?.status || scanResult.record?.status) === "LATE"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}>
                    {scanResult.receipt?.status || scanResult.record?.status || "PRESENT"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Verification Factors:</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {scanResult.receipt?.verificationMethod || scanResult.record?.verificationMethod || "QR"}
                    </span>
                    {scanResult.record?.distanceMeters !== null && scanResult.record?.distanceMeters !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {scanResult.record.distanceMeters}m geofence
                      </span>
                    )}
                  </div>
                </div>

                {scanResult.student?.newAttendanceRate !== undefined && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Updated Attendance:</span>
                    <span className="font-bold text-emerald-400">{scanResult.student.newAttendanceRate}%</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-600/20 text-sm"
              >
                Close & View Attendance
              </button>
            </div>
          ) : (
            /* Active Camera Scanner View */
            <div className="w-full flex flex-col items-center">
              {/* Camera Stream Container */}
              <div className="relative w-full aspect-square max-w-sm rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Viewfinder Target Graphic */}
                {cameraState === "ACTIVE" && !isVerifying && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-56 h-56 border-2 border-indigo-400/50 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                      {/* Laser scanning beam */}
                      <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-bounce opacity-80" />
                    </div>
                  </div>
                )}

                {/* Verifying Indicator Overlay */}
                {isVerifying && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-sm font-medium text-white">Validating Cryptographic Token...</span>
                  </div>
                )}

                {/* Camera Inactive / Denied States */}
                {cameraState === "REQUESTING" && (
                  <div className="text-center p-6 flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                    <p className="text-sm text-slate-300">Requesting camera access...</p>
                  </div>
                )}

                {cameraState === "DENIED" && (
                  <div className="text-center p-6 flex flex-col items-center gap-3">
                    <AlertTriangle className="w-10 h-10 text-amber-400" />
                    <p className="text-sm text-slate-300">Camera permission denied.</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {cameraState === "UNSUPPORTED" && (
                  <div className="text-center p-6 flex flex-col items-center gap-3">
                    <Smartphone className="w-10 h-10 text-rose-400" />
                    <p className="text-sm text-slate-300">{errorMessage || "Camera hardware unavailable."}</p>
                  </div>
                )}
              </div>

              {/* Error Alert Bar */}
              {errorMessage && (
                <div className="w-full mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Hardware Telemetry Bar: GPS + BLE */}
              <div className="w-full mt-4 grid grid-cols-2 gap-2">
                {/* GPS Status */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center gap-2.5">
                  <MapPin className={`w-4 h-4 ${geoState === "GRANTED" ? "text-emerald-400" : "text-slate-400"}`} />
                  <div className="text-left overflow-hidden">
                    <div className="text-[11px] font-medium text-slate-300 truncate">
                      {geoState === "GRANTED"
                        ? `GPS: ±${geoCoords?.accuracy}m`
                        : geoState === "FETCHING"
                        ? "Acquiring GPS..."
                        : "GPS Inactive"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {geoState === "GRANTED" ? "Geofence Ready" : "Tap to enable"}
                    </div>
                  </div>
                </div>

                {/* Web Bluetooth Status */}
                <div className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Bluetooth
                      className={`w-4 h-4 ${
                        bleState === "CONNECTED"
                          ? "text-blue-400"
                          : bleSupported
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    />
                    <div className="text-left overflow-hidden">
                      <div className="text-[11px] font-medium text-slate-300 truncate">
                        {bleState === "CONNECTED"
                          ? bleDeviceName || "Beacon Paired"
                          : bleSupported
                          ? "BLE Supported"
                          : "iOS/Safari (GPS Fallback)"}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {bleState === "CONNECTED" ? "Proximity Confirmed" : "Proximity Mode"}
                      </div>
                    </div>
                  </div>

                  {bleSupported && bleState !== "CONNECTED" && (
                    <button
                      onClick={connectClassroomBluetooth}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[10px] font-semibold rounded-lg border border-blue-500/30 transition-colors"
                    >
                      Pair
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <p className="text-xs text-slate-500 text-center mt-4">
                Point your camera at the rotating QR code projected on the classroom screen. Attendance is recorded instantly upon verification.
              </p>

              {/* Manual Passcode Fallback Toggle */}
              <div className="w-full mt-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors"
                >
                  {showManualInput ? "Hide manual token entry" : "Camera restricted or desktop? Enter code manually"}
                </button>

                {showManualInput && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (manualToken.trim()) {
                        handleCodeScanned(manualToken.trim());
                      }
                    }}
                    className="w-full mt-2.5 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Paste attendance token or pass-code..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!manualToken.trim() || isVerifying}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      {isVerifying ? "Verifying..." : "Verify"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
