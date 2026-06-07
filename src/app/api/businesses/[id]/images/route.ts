import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";

// GET /api/businesses/[id]/images
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const images = await db.businessImage.findMany({
      where: { businessId: id },
      orderBy: { isPrimary: "desc" },
    });

    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error("Error fetching business images:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

// POST /api/businesses/[id]/images
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      return NextResponse.json({ error: "No tienes permiso para subir fotos a este establecimiento" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Formato de imagen no permitido. Use JPG, JPEG, PNG o WEBP." }, { status: 400 });
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El tamaño máximo permitido es de 5MB por imagen." }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Create unique filename
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storagePath = `${id}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Error al subir la imagen al almacenamiento" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("business-images")
      .getPublicUrl(storagePath);

    // Get existing images count
    const existingImagesCount = await db.businessImage.count({
      where: { businessId: id },
    });

    const shouldBePrimary = isPrimary || existingImagesCount === 0;

    // If making this image primary, unset any existing primary
    if (shouldBePrimary) {
      await db.businessImage.updateMany({
        where: { businessId: id },
        data: { isPrimary: false },
      });
    }

    // Save metadata in database
    const newImage = await db.businessImage.create({
      data: {
        businessId: id,
        url: publicUrl,
        isPrimary: shouldBePrimary,
      },
    });

    return NextResponse.json({ success: true, image: newImage });
  } catch (error) {
    console.error("Error creating business image:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
