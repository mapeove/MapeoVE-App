import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aplicacion: "MapeoVE",
    version: "1.0.0",
    descripcion: "Plataforma de descubrimiento local para Venezuela",
    endpoints: [
      "GET /api/businesses",
      "GET /api/businesses/:id",
      "GET /api/businesses/search?q=",
      "GET /api/categories",
    ],
  });
}
