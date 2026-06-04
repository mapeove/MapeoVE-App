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

  // 4. Map profile to valid ORS profile
  const orsProfile = ORS_MODE_MAP[profile] || "driving-car";

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
