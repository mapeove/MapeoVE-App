import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const apiKey = process.env.MAPTILER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Geocodificación no configurada" }, { status: 501 });
  }

  try {
    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?key=${apiKey}&limit=5`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.error("Geocoding error:", res.status, await res.text());
      return NextResponse.json({ error: "Error en el servicio de geocodificación" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocoding exception:", error);
    return NextResponse.json({ error: "Error interno en geocodificación" }, { status: 500 });
  }
}
