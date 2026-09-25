"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Maximize2,
  Minimize2,
  X,
  Pause,
  Play,
  CheckCircle,
  Users,
  Clock,
  ShieldCheck,
  RefreshCw,
  Lock,
  Radio,
  MapPin,
} from "lucide-react";

interface ProjectorModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  courseCode: string;
  courseTitle: string;
  roomName?: string;
  onSessionUpdated?: () => void;
}

export default function ProjectorModeModal({
  isOpen,
  onClose,
  sessionId,
  courseCode,
  courseTitle,
  roomName = "Alan Turing Lecture Hall",
  onSessionUpdated,
}: ProjectorModeModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string>("");
  const [remainingSeconds, setRemainingSeconds] = useState<number>(15);
  const [rotationSeconds, setRotationSeconds] = useState<number>(15);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [presentCount, setPresentCount] = useState<number>(0);
  const [enrolledCount, setEnrolledCount] = useState<number>(0);
  const [recentCheckins, setRecentCheckins] = useState<any[]>([]);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  // Poll for live QR rotation and student check-ins
  const fetchQrToken = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}/qr`);
      if (!res.ok) return;

      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setRemainingSeconds(data.remainingSeconds ?? 15);
        setRotationSeconds(data.rotationSeconds ?? 15);
        setStatus(data.status || "ACTIVE");
        setPresentCount(data.presentCount || 0);
        setEnrolledCount(data.enrolledCount || 0);
        if (data.recentCheckins) {
          setRecentCheckins(data.recentCheckins);
        }

        // Generate QR image
        const url = await QRCode.toDataURL(data.token, {
          width: 480,
          margin: 2,
          color: {
            dark: "#090d16",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        });
        setQrDataUrl(url);
      }
    } catch (err) {
      console.error("Failed to poll session QR:", err);
    }
  };

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    fetchQrToken();
    const pollInterval = setInterval(fetchQrToken, 2500);

    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId]);

  // Local second-by-second countdown ticker
  useEffect(() => {
    if (!isOpen || status !== "ACTIVE") return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          fetchQrToken();
          return rotationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, status, rotationSeconds]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error entering fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
      setIsFullscreen(false);
    }
  };

  // Pause / Resume Session
  const togglePauseSession = async () => {
    setIsUpdatingState(true);
    try {
      const nextAction = status === "ACTIVE" ? "PAUSE" : "RESUME";
      const res = await fetch("/api/attendance/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: nextAction }),
      });
      if (res.ok) {
        setStatus(nextAction === "PAUSE" ? "PAUSED" : "ACTIVE");
        fetchQrToken();
        if (onSessionUpdated) onSessionUpdated();
      }
    } catch (err) {
      console.error("Failed to toggle session state:", err);
    } finally {
      setIsUpdatingState(false);
    }
  };

  // End and lock session
  const closeSession = async () => {
    if (!confirm("Are you sure you want to finalize and lock this attendance session? Students will no longer be able to scan.")) {
      return;
    }

    setIsUpdatingState(true);
    try {
      const res = await fetch("/api/attendance/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, action: "CLOSE" }),
      });
      if (res.ok) {
        setStatus("CLOSED");
        if (onSessionUpdated) onSessionUpdated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to close session:", err);
    } finally {
      setIsUpdatingState(false);
    }
  };

  if (!isOpen) return null;

  const percentage = enrolledCount > 0 ? Math.round((presentCount / enrolledCount) * 100) : 0;
  const countdownProgress = ((rotationSeconds - remainingSeconds) / rotationSeconds) * 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-300"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
            {courseCode.substring(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">{courseCode} — {courseTitle}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
                status === "ACTIVE" 
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                <span className={`w-2 h-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {roomName}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Anti-Proxy HMAC Protected
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                BLE Proximity Beacon Enabled
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={togglePauseSession}
            disabled={isUpdatingState}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition-colors"
          >
            {status === "ACTIVE" ? (
              <>
                <Pause className="w-4 h-4 text-amber-400" />
                Pause Rotation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                Resume Session
              </>
            )}
          </button>

          <button
            onClick={closeSession}
            disabled={isUpdatingState}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-sm font-medium border border-rose-500/30 transition-colors"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            Finalize Session
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition-colors"
            title="Close Projector Mode"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Projector Arena */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-12 px-8 py-6 max-w-7xl mx-auto w-full">
        {/* Left Column: High-Contrast Dynamic QR Code Display */}
        <div className="flex flex-col items-center">
          <div className="relative p-6 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border-4 border-slate-100 flex flex-col items-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="Dynamic Rotating Attendance QR"
                className="w-72 h-72 md:w-96 md:h-96 object-contain rounded-xl"
              />
            ) : (
              <div className="w-72 h-72 md:w-96 md:h-96 flex flex-col items-center justify-center bg-slate-100 rounded-xl gap-3 text-slate-700">
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-600" />
                <span className="font-semibold text-sm">Generating Cryptographic Token...</span>
              </div>
            )}

            {/* Countdown Progress Bar */}
            <div className="w-full mt-4 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Token Refresh in
                </span>
                <span className="text-indigo-600 font-mono text-sm">{remainingSeconds}s</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${100 - countdownProgress}%` }}
                />
              </div>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-400 mt-4 text-center max-w-md">
            Scan via your student CLASSROOM dashboard. Code refreshes every {rotationSeconds}s to prevent screenshot proxying.
          </p>
        </div>

        {/* Right Column: Real-Time Telemetry & Live Check-in Ticker */}
        <div className="w-full lg:w-96 flex flex-col gap-5">
          {/* Big Attendance Metric Counter */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Present in Hall</span>
                <div className="text-4xl font-extrabold text-white mt-1">
                  {presentCount} <span className="text-xl font-normal text-slate-500">/ {enrolledCount}</span>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                <span className="text-emerald-400 font-bold text-lg">{percentage}%</span>
                <span className="text-[9px] text-emerald-500 uppercase font-semibold">Turnout</span>
              </div>
            </div>

            {/* Turnout Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full shadow-lg shadow-emerald-500/50"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Real-Time Live Check-in Stream Ticker */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col gap-3 flex-1 max-h-72">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-semibold text-white">Live Check-in Feed</h4>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Polling
              </span>
            </div>

            <div className="overflow-y-auto space-y-2 pr-1">
              {recentCheckins.length > 0 ? (
                recentCheckins.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-between animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.rollNumber}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{item.time}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Clock className="w-6 h-6 text-slate-600 animate-spin" />
                  <span>Awaiting student scans...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info Bar */}
      <div className="px-8 py-3.5 border-t border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span>CLASSROOM Academic OS • Smart Multi-Factor Attendance Engine v2.4</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>SESSION ID: {sessionId.substring(0, 13)}...</span>
          <span>COORDINATES: VERIFIED</span>
        </div>
      </div>
    </div>
  );
}
