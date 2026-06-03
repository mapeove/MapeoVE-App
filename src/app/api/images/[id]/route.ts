import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Look up the BusinessImage record and redirect to its public URL
    const img = await db.businessImage.findUnique({
      where: { id },
    });

    if (!img) {
      return new NextResponse("Imagen no encontrada", { status: 404 });
    }

    // Redirect to the Supabase Storage public URL
    return NextResponse.redirect(img.imageUrl, 301);
  } catch (error) {
    console.error("Error al obtener imagen:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}
