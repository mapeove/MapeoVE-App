import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get("start"); // "lng,lat"
  const end = searchParams.get("end"); // "lng,lat"
  const profile = searchParams.get("profile") || "driving-car";

  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La navegación no está configurada todavía" },
      { status: 501 }
    );
  }

  if (!start || !end) {
    return NextResponse.json(
      { error: "Faltan parámetros de coordenadas 'start' y 'end'." },
      { status: 400 }
    );
  }

  try {
    // OpenRouteService expects start and end as longitude,latitude query parameters
    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start}&end=${end}`;
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json, application/geo+json; charset=utf-8",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouteService API Error:", errText);
      return NextResponse.json(
        { error: "Error de OpenRouteService al calcular la ruta" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in directions backend:", error);
    return NextResponse.json(
      { error: "Error interno al calcular la ruta" },
      { status: 500 }
    );
  }
}
