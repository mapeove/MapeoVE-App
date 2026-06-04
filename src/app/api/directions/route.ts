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

  // Venezuela specific validation (approximate bounds)
  const venezuelaLatMin = 0;
  const venezuelaLatMax = 13;
  const venezuelaLngMin = -74;
  const venezuelaLngMax = -59;
  const inVenezuela = (lat: number, lng: number) =>
    lat >= venezuelaLatMin && lat <= venezuelaLatMax && lng >= venezuelaLngMin && lng <= venezuelaLngMax;
  if (!inVenezuela(startLat, startLng) || !inVenezuela(endLat, endLng)) {
    console.warn('ORS request denied: coordenadas fuera de Venezuela');
    return NextResponse.json(
      { error: "Las coordenadas de origen o destino no son válidas para Venezuela." },
      { status: 400 }
    );
  }

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

      let orsMsg = "";
      try {
        const parsed = JSON.parse(body);
        orsMsg = parsed?.error?.message || parsed?.message || "";
      } catch {
        orsMsg = body.substring(0, 200);
      }

      if (response.status === 403) {
        return NextResponse.json(
          { error: "ORS_API_KEY inválida o sin permisos" },
          { status: 403 }
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Límite de peticiones de ORS alcanzado. Intenta en unos minutos." },
          { status: 429 }
        );
      }
      if (orsMsg.toLowerCase().includes("could not find") || orsMsg.toLowerCase().includes("no route")) {
        return NextResponse.json(
          { error: "ORS no encontró ruta entre esos puntos" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: `ORS error ${response.status}: ${orsMsg || "sin detalles"}` },
        { status: response.status }
      );
    }

    const data = JSON.parse(body);

    // 6. Extract summary and return structured response
    if (!data.features || data.features.length === 0) {
      return NextResponse.json(
        { error: "ORS no encontró ruta disponible entre esos puntos" },
        { status: 404 }
      );
    }

    const feature = data.features[0];
    const summary = feature.properties?.summary;

    if (!summary) {
      return NextResponse.json(
        { error: "ORS devolvió respuesta incompleta (sin summary)" },
        { status: 502 }
      );
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
    });
  } catch (error) {
    console.error("Error calling ORS:", error);
    return NextResponse.json(
      { error: "Error interno al conectar con OpenRouteService" },
      { status: 500 }
    );
  }
}
