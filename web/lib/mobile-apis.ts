"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────
//  Page Visibility API
//  Detects when user switches tabs / minimizes browser.
//  Triggers distraction alert and can call onDistracted callback.
// ─────────────────────────────────────────────────────────
export function usePageVisibility(onDistracted?: () => void) {
  const [isVisible, setIsVisible] = useState(true);
  const [distractionCount, setDistractionCount] = useState(0);
  const onDistractedRef = useRef(onDistracted);
  onDistractedRef.current = onDistracted;

  useEffect(() => {
    const handler = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      if (!visible) {
        setDistractionCount(c => c + 1);
        onDistractedRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return { isVisible, distractionCount };
}

// ─────────────────────────────────────────────────────────
//  Device Motion API
//  Detects phone pickup / excessive movement during focus mode.
//  Triggers callback when acceleration exceeds threshold.
// ─────────────────────────────────────────────────────────

const MOTION_THRESHOLD = 15; // m/s² — heavy shake / pickup

export function useDeviceMotion(onPhonePickup?: () => void, enabled = true) {
  const [isPhoneDown, setIsPhoneDown] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const cooldownRef = useRef(false);
  const onPickupRef = useRef(onPhonePickup);
  onPickupRef.current = onPhonePickup;

  const requestPermission = useCallback(async () => {
    // iOS 13+ requires explicit permission
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const result = await (DeviceMotionEvent as any).requestPermission();
        setPermissionGranted(result === "granted");
      } catch {
        setPermissionGranted(false);
      }
    } else {
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled || permissionGranted === false) return;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const total = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);

      if (total > MOTION_THRESHOLD && !cooldownRef.current) {
        setIsPhoneDown(false);
        onPickupRef.current?.();
        cooldownRef.current = true;
        // 3s cooldown before triggering again
        setTimeout(() => {
          cooldownRef.current = false;
          setIsPhoneDown(true);
        }, 3000);
      }
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled, permissionGranted]);

  return { isPhoneDown, permissionGranted, requestPermission };
}

// ─────────────────────────────────────────────────────────
//  Screen Wake Lock API
//  Keeps screen on during active sprint so timer stays visible.
// ─────────────────────────────────────────────────────────
export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!isSupported) return;
    try {
      lockRef.current = await navigator.wakeLock.request("screen");
      setIsLocked(true);
      lockRef.current.addEventListener("release", () => setIsLocked(false));
    } catch (err) {
      console.warn("Wake lock failed:", err);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (lockRef.current) {
      await lockRef.current.release();
      lockRef.current = null;
      setIsLocked(false);
    }
  }, []);

  // Re-acquire on visibility change (browsers release on tab hide)
  useEffect(() => {
    const handler = () => {
      if (!document.hidden && isLocked) acquire();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [isLocked, acquire]);

  // Release on unmount
  useEffect(() => () => { lockRef.current?.release().catch(() => {}); }, []);

  return { isLocked, isSupported, acquire, release };
}

// ─────────────────────────────────────────────────────────
//  Sprint Timer Hook
//  Combines countdown + wake lock + visibility + motion.
// ─────────────────────────────────────────────────────────
export function useSprintTimer(deadlineTs: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, deadlineTs - Math.floor(Date.now() / 1000)));
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (remaining <= 0) { setIsExpired(true); return; }
    const interval = setInterval(() => {
      const r = Math.max(0, deadlineTs - Math.floor(Date.now() / 1000));
      setRemaining(r);
      if (r === 0) { setIsExpired(true); clearInterval(interval); }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineTs, remaining]);

  const format = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return { remaining, formattedRemaining: format(remaining), isExpired };
}
