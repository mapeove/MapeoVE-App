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

// ─── Snapped position result type ────────────────────────────────────────────
interface SnappedResult {
  lat: number;
  lng: number;
  segmentIndex: number;
  distanceToRoute: number;
}

// ─── Project a point P(lat, lng) onto the closest segment of the polyline ─────
function findSnappedPosition(
  lat: number,
  lng: number,
  routeGeoJSON: any
): SnappedResult {
  const result: SnappedResult = { lat, lng, segmentIndex: 0, distanceToRoute: Infinity };
  try {
    const coords: [number, number][] =
      routeGeoJSON?.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length < 2) return result;

    let min = Infinity;
    let bestLat = lat;
    let bestLng = lng;
    let bestSegmentIndex = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const aLng = coords[i][0];
      const aLat = coords[i][1];
      const bLng = coords[i + 1][0];
      const bLat = coords[i + 1][1];

      const dx = bLng - aLng;
      const dy = bLat - aLat;
      const lenSq = dx * dx + dy * dy;

      let t = 0;
      if (lenSq > 0) {
        t = Math.max(0, Math.min(1, ((lng - aLng) * dx + (lat - aLat) * dy) / lenSq));
      }

      const projLat = aLat + t * dy;
      const projLng = aLng + t * dx;
      const dist = haversineDistance(lat, lng, projLat, projLng);

      if (dist < min) {
        min = dist;
        bestLat = projLat;
        bestLng = projLng;
        bestSegmentIndex = i;
      }
    }

    result.lat = bestLat;
    result.lng = bestLng;
    result.segmentIndex = bestSegmentIndex;
    result.distanceToRoute = min;
    return result;
  } catch {
    return result;
  }
}

// ─── Calculate distance along route coordinates ──────────────────────────────
function calculateDistanceAlongRoute(
  snappedLat: number,
  snappedLng: number,
  startIndex: number,
  targetIndex: number,
  coords: [number, number][]
): number {
  if (targetIndex <= startIndex) {
    return haversineDistance(snappedLat, snappedLng, coords[targetIndex][1], coords[targetIndex][0]);
  }

  // Distance from snapped position to the next coordinate index
  let dist = haversineDistance(snappedLat, snappedLng, coords[startIndex + 1][1], coords[startIndex + 1][0]);

  // Sum of segment distances between coords[startIndex + 1] and coords[targetIndex]
  for (let i = startIndex + 1; i < targetIndex; i++) {
    dist += haversineDistance(
      coords[i][1],
      coords[i][0],
      coords[i + 1][1],
      coords[i + 1][0]
    );
  }

  return dist;
}

// ─── Map ORS maneuver codes to Spanish descriptions ──────────────────────────
function getManeuverText(type: number): string {
  switch (type) {
    case 0: // Left
    case 2: // Sharp left
    case 4: // Slight left
      return "Gira a la izquierda";
    case 1: // Right
    case 3: // Sharp right
    case 5: // Slight right
      return "Gira a la derecha";
    case 6: // Straight
      return "Continúa recto";
    case 7: // Enter roundabout
    case 8: // Exit roundabout
      return "Toma la rotonda";
    case 10: // Goal
      return "Has llegado";
    case 11: // Depart
      return "Continúa recto";
    case 12: // Keep left
      return "Mantente a la izquierda";
    case 13: // Keep right
      return "Mantente a la derecha";
    case 9: // U-turn
      return "Da la vuelta en U";
    default:
      return "Continúa recto";
  }
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
const MIN_MOVE_METERS = 3; // Lowered to 3m for better responsiveness
const RECALC_COOLDOWN_MS = 10_000; // max 1 recalculation every 10 seconds
const DEVIATION_GRACE_MS = 3_000; // wait 3s of sustained deviation before recalculating
const ARRIVAL_RADIUS_METERS = 15; // consider arrived when within 15m of destination

// ─── Public types ─────────────────────────────────────────────────────────────
export interface LiveNavState {
  livePosition: { lat: number; lng: number } | null;
  remainingDistance: number | null; // meters
  remainingTime: number | null; // seconds
  isDeviated: boolean;
  isRecalculating: boolean;
  gpsError: string | null;
  hasArrived: boolean; // true when within 15m of destination
  stopTracking: () => void;
  nextManeuver: { text: string; distanceText: string } | null;
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
function formatDistanceHelper(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
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
  const [nextManeuver, setNextManeuver] = useState<{ text: string; distanceText: string } | null>(null);

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
    setNextManeuver(null);
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

    setGpsError(null);

    const dest = destRef.current;
    const isFallback = isFallbackRef.current;
    const route = routeRef.current;
    const mode = modeRef.current;

    const deviationThreshold = mode === "foot-walking" ? 30 : mode === "cycling-regular" ? 50 : 80;

    let finalLat = lat;
    let finalLng = lng;
    let snappedResult: SnappedResult | null = null;

    if (!isFallback && route) {
      snappedResult = findSnappedPosition(lat, lng, route);
      if (snappedResult.distanceToRoute <= deviationThreshold) {
        finalLat = snappedResult.lat;
        finalLng = snappedResult.lng;
      }
    }

    setLivePosition({ lat: finalLat, lng: finalLng });

    // ── Calculate remaining distance and time estimate along route ─────────────────
    let finalDistToDest = haversineDistance(lat, lng, dest?.lat ?? lat, dest?.lng ?? lng);
    if (!isFallback && route && snappedResult) {
      const coords = route?.features?.[0]?.geometry?.coordinates || [];
      if (coords.length >= 2) {
        finalDistToDest = calculateDistanceAlongRoute(
          finalLat,
          finalLng,
          snappedResult.segmentIndex,
          coords.length - 1,
          coords
        );
      }
    }

    setRemainingDistance(finalDistToDest);
    setRemainingTime(finalDistToDest / speedForMode(mode));

    // ── Arrival detection: stop tracking when within 15m of destination ─────
    if (finalDistToDest <= ARRIVAL_RADIUS_METERS) {
      setHasArrived(true);
      setNextManeuver({
        text: "Has llegado a tu destino",
        distanceText: "0 m"
      });
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return; // skip deviation check
    }

    // ── Maneuver instructions calculation ─────────────────────────
    if (!isFallback && route && snappedResult) {
      const coords = route?.features?.[0]?.geometry?.coordinates || [];
      const steps = route?.features?.[0]?.properties?.segments?.[0]?.steps || [];

      if (coords.length >= 2 && steps.length > 0) {
        const segmentIdx = snappedResult.segmentIndex;
        let currentStepIndex = -1;
        for (let i = 0; i < steps.length; i++) {
          const [startIdx, endIdx] = steps[i].way_points;
          if (segmentIdx >= startIdx && segmentIdx <= endIdx) {
            currentStepIndex = i;
            break;
          }
        }

        if (currentStepIndex !== -1) {
          if (currentStepIndex < steps.length - 1) {
            const nextStep = steps[currentStepIndex + 1];
            const targetIdx = nextStep.way_points[0];
            const distToManeuver = calculateDistanceAlongRoute(
              finalLat,
              finalLng,
              segmentIdx,
              targetIdx,
              coords
            );

            const typeText = getManeuverText(nextStep.type);
            const distText = formatDistanceHelper(distToManeuver);

            let text = "";
            if (nextStep.type === 6 || nextStep.type === 11) {
              text = `Continúa recto durante ${distText}`;
            } else {
              text = `${typeText} en ${distText}`;
            }

            setNextManeuver({
              text,
              distanceText: distText
            });
          } else {
            const targetIdx = coords.length - 1;
            const distToDest = calculateDistanceAlongRoute(
              finalLat,
              finalLng,
              segmentIdx,
              targetIdx,
              coords
            );
            setNextManeuver({
              text: "Has llegado a tu destino",
              distanceText: formatDistanceHelper(distToDest)
            });
          }
        }
      }
    } else {
      // Fallback route (straight-line)
      if (dest) {
        const distToDest = haversineDistance(lat, lng, dest.lat, dest.lng);
        setNextManeuver({
          text: `Continúa recto durante ${formatDistanceHelper(distToDest)}`,
          distanceText: formatDistanceHelper(distToDest)
        });
      }
    }

    // ── Route deviation check (ORS routes only, skip straight-line fallback) ──
    if (!isFallback && route && snappedResult) {
      const distToRoute = snappedResult.distanceToRoute;
      const deviated = distToRoute > deviationThreshold;

      if (deviated) {
        setIsDeviated(true);

        const cooldownOk =
          Date.now() - lastRecalcRef.current > RECALC_COOLDOWN_MS;

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
    nextManeuver,
  };
}
