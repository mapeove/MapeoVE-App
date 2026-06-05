"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Haversine distance between two coordinates (meters) ─────────────────────
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Distance from point to a segment (degrees, approximation good <100km) ───
function pointToSegmentDist(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineDistance(pLat, pLng, aLat, aLng);
  const t = Math.max(
    0,
    Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq)
  );
  return haversineDistance(pLat, pLng, aLat + t * dy, aLng + t * dx);
}

// ─── Min distance from a lat/lng point to a GeoJSON route polyline ───────────
function distanceToRoute(lat: number, lng: number, routeGeoJSON: any): number {
  try {
    const coords: [number, number][] =
      routeGeoJSON?.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return Infinity;
    let min = Infinity;
    for (let i = 0; i < coords.length - 1; i++) {
      const d = pointToSegmentDist(
        lat,
        lng,
        coords[i][1],
        coords[i][0],
        coords[i + 1][1],
        coords[i + 1][0]
      );
      if (d < min) min = d;
    }
    return min;
  } catch {
    return Infinity;
  }
}

// ─── Estimated speed in m/s by transport mode ────────────────────────────────
function speedForMode(mode: string): number {
  const table: Record<string, number> = {
    "driving-car": 13.9, // ~50 km/h
    "driving-car-moto": 16.7, // ~60 km/h
    "cycling-regular": 4.2, // ~15 km/h
    "foot-walking": 1.4, // ~5 km/h
  };
  return table[mode] ?? 13.9;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEVIATION_METERS = 80;
const MIN_MOVE_METERS = 10;
const RECALC_COOLDOWN_MS = 10_000; // max 1 recalculation every 10 seconds
const DEVIATION_GRACE_MS = 3_000; // wait 3s of sustained deviation before recalculating
const ARRIVAL_RADIUS_METERS = 50; // consider arrived when within 50m of destination

// ─── Public types ─────────────────────────────────────────────────────────────
export interface LiveNavState {
  livePosition: { lat: number; lng: number } | null;
  remainingDistance: number | null; // meters
  remainingTime: number | null; // seconds (speed estimate)
  isDeviated: boolean;
  isRecalculating: boolean;
  gpsError: string | null;
  hasArrived: boolean; // true when within 50m of destination
  stopTracking: () => void;
}

export interface UseLiveNavigationOptions {
  /** Start tracking only when navigation is active */
  isActive: boolean;
  /** Current route GeoJSON for deviation check */
  routeGeoJSON: any;
  /** Destination coordinates */
  destCoords: { lat: number; lng: number } | null;
  /** Current transport mode (for speed estimate) */
  transportMode: string;
  /** True if route is Haversine fallback — skips deviation check */
  isFallback: boolean;
  /** Called when auto-recalculation is triggered */
  onRecalculate: (
    mode: string,
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLiveNavigation({
  isActive,
  routeGeoJSON,
  destCoords,
  transportMode,
  isFallback,
  onRecalculate,
}: UseLiveNavigationOptions): LiveNavState {
  const [livePosition, setLivePosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [remainingDistance, setRemainingDistance] = useState<number | null>(
    null
  );
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isDeviated, setIsDeviated] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);

  // Refs for values used inside the stable GPS callback.
  // Using refs avoids re-registering watchPosition on every render.
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastRecalcRef = useRef<number>(0);
  const deviationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRecalculatingRef = useRef(false);

  const destRef = useRef(destCoords);
  const routeRef = useRef(routeGeoJSON);
  const modeRef = useRef(transportMode);
  const isFallbackRef = useRef(isFallback);
  const onRecalculateRef = useRef(onRecalculate);

  // Keep refs in sync with latest prop values
  useEffect(() => {
    destRef.current = destCoords;
  }, [destCoords]);
  useEffect(() => {
    routeRef.current = routeGeoJSON;
  }, [routeGeoJSON]);
  useEffect(() => {
    modeRef.current = transportMode;
  }, [transportMode]);
  useEffect(() => {
    isFallbackRef.current = isFallback;
  }, [isFallback]);
  useEffect(() => {
    onRecalculateRef.current = onRecalculate;
  }, [onRecalculate]);

  // ─── Stop tracking — clears watchPosition and all timers ─────────────────
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (deviationTimerRef.current) {
      clearTimeout(deviationTimerRef.current);
      deviationTimerRef.current = null;
    }
    setIsDeviated(false);
    setIsRecalculating(false);
    isRecalculatingRef.current = false;
    lastPosRef.current = null;
    setHasArrived(false);
  }, []);

  // ─── GPS position handler — STABLE (all mutable values via refs) ──────────
  const handlePosition = useCallback((pos: GeolocationPosition) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // Ignore movements smaller than MIN_MOVE_METERS (avoids noise)
    if (lastPosRef.current) {
      const moved = haversineDistance(
        lastPosRef.current.lat,
        lastPosRef.current.lng,
        lat,
        lng
      );
      if (moved < MIN_MOVE_METERS) return;
    }
    lastPosRef.current = { lat, lng };

    setLivePosition({ lat, lng });
    setGpsError(null);

    // ── Update remaining distance and time estimate ──────────────────────────────────
    const dest = destRef.current;
    if (dest) {
      const dist = haversineDistance(lat, lng, dest.lat, dest.lng);
      setRemainingDistance(dist);
      setRemainingTime(dist / speedForMode(modeRef.current));

      // ── Arrival detection: stop tracking when within 50m of destination ─────
      if (dist <= ARRIVAL_RADIUS_METERS) {
        setHasArrived(true);
        // Stop the watchPosition — user has arrived, no more tracking needed
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        return; // skip deviation check
      }
    }

    // ── Route deviation check (ORS routes only, skip straight-line fallback) ──
    if (!isFallbackRef.current && routeRef.current) {
      const distToRoute = distanceToRoute(lat, lng, routeRef.current);
      const deviated = distToRoute > DEVIATION_METERS;

      if (deviated) {
        setIsDeviated(true);

        const cooldownOk =
          Date.now() - lastRecalcRef.current > RECALC_COOLDOWN_MS;

        // Trigger recalculation after DEVIATION_GRACE_MS of sustained deviation
        if (
          cooldownOk &&
          dest &&
          !isRecalculatingRef.current &&
          !deviationTimerRef.current
        ) {
          deviationTimerRef.current = setTimeout(async () => {
            deviationTimerRef.current = null;
            const currentDest = destRef.current;
            if (!currentDest || isRecalculatingRef.current) return;

            isRecalculatingRef.current = true;
            setIsRecalculating(true);
            lastRecalcRef.current = Date.now();

            try {
              await onRecalculateRef.current(
                modeRef.current,
                { lat, lng },
                currentDest
              );
            } finally {
              isRecalculatingRef.current = false;
              setIsRecalculating(false);
              setIsDeviated(false);
            }
          }, DEVIATION_GRACE_MS);
        }
      } else {
        // User is back on route — cancel pending recalculation
        setIsDeviated(false);
        if (deviationTimerRef.current) {
          clearTimeout(deviationTimerRef.current);
          deviationTimerRef.current = null;
        }
      }
    }
  }, []); // empty deps — uses refs to access all external values

  // ─── GPS error handler ────────────────────────────────────────────────────
  const handleError = useCallback((err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        setGpsError("Activa tu ubicación para navegación en tiempo real.");
        break;
      case err.POSITION_UNAVAILABLE:
        setGpsError("GPS no disponible en este dispositivo.");
        break;
      default:
        setGpsError("Error al obtener tu ubicación GPS.");
    }
  }, []);

  // ─── Register / unregister watchPosition ─────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      stopTracking();
      return;
    }

    if (!("geolocation" in navigator)) {
      setGpsError("GPS no disponible en este dispositivo.");
      return;
    }

    setGpsError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      }
    );

    return () => {
      stopTracking();
    };
  }, [isActive, handlePosition, handleError, stopTracking]);

  return {
    livePosition,
    remainingDistance,
    remainingTime,
    isDeviated,
    isRecalculating,
    gpsError,
    hasArrived,
    stopTracking,
  };
}
