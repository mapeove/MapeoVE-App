import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";

// DELETE /api/businesses/[id]/images/[imageId]
export async function DELETE(
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
      return NextResponse.json({ error: "No tienes permiso para eliminar fotos de este establecimiento" }, { status: 403 });
    }

    // Find the image metadata in db
    const image = await db.businessImage.findUnique({
      where: { id: imageId },
    });
    if (!image || image.businessId !== id) {
      return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
    }

    // Extract storage path from the public URL
    // Public URL format: https://[project-id].supabase.co/storage/v1/object/public/business-images/[businessId]/[filename]
    const urlParts = image.url.split("/business-images/");
    const storagePath = urlParts[1];

    if (storagePath) {
      // Remove from Supabase Storage
      const { error: deleteStorageError } = await supabase.storage
        .from("business-images")
        .remove([storagePath]);

      if (deleteStorageError) {
        console.error("Error deleting from Supabase storage:", deleteStorageError);
      }
    }

    // Delete from database
    await db.businessImage.delete({
      where: { id: imageId },
    });

    // If the deleted image was the primary one, make another image primary if available
    if (image.isPrimary) {
      const nextImage = await db.businessImage.findFirst({
        where: { businessId: id },
        orderBy: { createdAt: "asc" },
      });
      if (nextImage) {
        await db.businessImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting business image:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
