import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";

// PATCH /api/businesses/[id]/images/[imageId]/primary
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const { id, imageId } = await params;

    // Verify authentication
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Check if business exists
    const business = await db.business.findUnique({
      where: { id },
    });
    if (!business) {
      return NextResponse.json({ error: "Establecimiento no encontrado" }, { status: 404 });
    }

    // Check permissions: SUPER_ADMIN or business owner
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isOwner = business.ownerId === session.userId;
    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json({ error: "No tienes permiso para actualizar las fotos de este establecimiento" }, { status: 403 });
    }

    // Check if the image exists
    const image = await db.businessImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.businessId !== id) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    // Set all other images for this business to not primary
    await db.businessImage.updateMany({
      where: { businessId: id },
      data: { isPrimary: false },
    });

    // Set this image as primary
    const updatedImage = await db.businessImage.update({
      where: { id: imageId },
      data: { isPrimary: true },
    });

    return NextResponse.json({ success: true, image: updatedImage });
  } catch (error) {
    console.error("Error setting primary business image:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
