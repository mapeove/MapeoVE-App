import { NextRequest, NextResponse } from "next/server";

// ORS only supports these profiles. Moto maps to driving-car.
const ORS_MODE_MAP: Record<string, string> = {
  "driving-car": "driving-car",
  "driving-car-moto": "driving-car",
  "cycling-regular": "cycling-regular",
  "foot-walking": "foot-walking",
};

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} h ${m} min`;
  }
  return `${minutes} min`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start"); // expected: "lng,lat"
  const end   = searchParams.get("end");   // expected: "lng,lat"
  const profile = searchParams.get("profile") || "driving-car";

  // 1. API key check
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Navegación no configurada: falta ORS_API_KEY en el servidor" },
      { status: 501 }
    );
  }

  // 2. Params present
  if (!start || !end) {
    return NextResponse.json(
      { error: "Faltan parámetros: start y end son requeridos (formato lng,lat)" },
      { status: 400 }
    );
  }

  // 3. Validate coordinate format: each must be "number,number"
  const parseCoord = (raw: string) => {
    const parts = raw.split(",");
    if (parts.length !== 2) return null;
    const [a, b] = parts.map(Number);
    if (isNaN(a) || isNaN(b)) return null;
    return [a, b] as [number, number]; // [lng, lat] — ORS format
  };

  const startCoord = parseCoord(start);
  const endCoord   = parseCoord(end);

  if (!startCoord || !endCoord) {
    return NextResponse.json(
      { error: "Coordenadas inválidas. Formato esperado: lng,lat (ej: -67.33,10.22)" },
      { status: 400 }
    );
  }

  // Validate generic ranges
  const [startLng, startLat] = startCoord;
  const [endLng, endLat] = endCoord;

  const isLatValid = (lat: number) => lat >= -90 && lat <= 90;
  const isLngValid = (lng: number) => lng >= -180 && lng <= 180;
  if (!isLatValid(startLat) || !isLngValid(startLng) || !isLatValid(endLat) || !isLngValid(endLng)) {
    console.warn('ORS request denied: coordenadas fuera de rango global');
    return NextResponse.json(
      { error: "Las coordenadas están fuera de los rangos permitidos (lat -90..90, lng -180..180)." },
      { status: 400 }
    );
  }

  // Removed Venezuela specific validation to allow global routing

  // Helper for Haversine distance
  function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const toRad = (val: number) => val * Math.PI / 180;
    const phi1 = toRad(lat1);
    const phi2 = toRad(lat2);
    const deltaPhi = toRad(lat2 - lat1);
    const deltaLambda = toRad(lon2 - lon1);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const createFallbackResponse = () => {
    const dist = calculateHaversine(startLat, startLng, endLat, endLng);
    return NextResponse.json({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [startLng, startLat],
              [endLng, endLat]
            ]
          },
          properties: {
            summary: {
              distance: dist,
              duration: 0
            }
          }
        }
      ],
      distanceMeters: dist,
      durationSeconds: 0,
      distanceText: formatDistance(dist),
      durationText: "", // Empty duration for fallback
      isFallback: true
    });
  };

  // 4. Map profile to valid ORS profile
  const orsProfile = ORS_MODE_MAP[profile] || "driving-car";

  // ── LOG TEMPORAL DE DIAGNÓSTICO ───────────────────────────────────────────
  console.log("[ORS DEBUG] ─────────────────────────────────────────────────");
  console.log("[ORS DEBUG] startLng  :", startLng,  " | startLat  :", startLat);
  console.log("[ORS DEBUG] endLng    :", endLng,    " | endLat    :", endLat);
  console.log("[ORS DEBUG] orsProfile:", orsProfile);
  console.log("[ORS DEBUG] URL (sin API key):", `https://api.openrouteservice.org/v2/directions/${orsProfile}?start=${start}&end=${end}`);
  console.log("[ORS DEBUG] ─────────────────────────────────────────────────");
  // ── FIN LOG TEMPORAL ──────────────────────────────────────────────────────

  // 5. Call ORS
  try {
    const url = `https://api.openrouteservice.org/v2/directions/${orsProfile}?api_key=${apiKey}&start=${start}&end=${end}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, application/geo+json; charset=utf-8",
      },
    });

    const body = await response.text();

    if (!response.ok) {
      console.error("ORS error response:", response.status, body);
      return createFallbackResponse();
    }

    const data = JSON.parse(body);

    // 6. Extract summary and return structured response
    if (!data.features || data.features.length === 0) {
      return createFallbackResponse();
    }

    const feature = data.features[0];
    const summary = feature.properties?.summary;

    if (!summary) {
      return createFallbackResponse();
    }

    // ── LOG RESULTADO ORS ────────────────────────────────────────────────────
    console.log("[ORS DEBUG] RESULTADO ───────────────────────────────────────");
    console.log("[ORS DEBUG] distanceMeters :", summary.distance);
    console.log("[ORS DEBUG] durationSeconds:", summary.duration);
    console.log("[ORS DEBUG] distanceText   :", formatDistance(summary.distance));
    console.log("[ORS DEBUG] durationText   :", formatDuration(summary.duration));
    console.log("[ORS DEBUG] ─────────────────────────────────────────────────");
    // ── FIN LOG RESULTADO ────────────────────────────────────────────────────

    return NextResponse.json({
      // raw GeoJSON for drawing the route on the map
      ...data,
      // convenience fields
      distanceMeters: summary.distance,
      durationSeconds: summary.duration,
      distanceText: formatDistance(summary.distance),
      durationText: formatDuration(summary.duration),
      isFallback: false
    });
  } catch (error) {
    console.error("Error calling ORS:", error);
    return createFallbackResponse();
  }
}
