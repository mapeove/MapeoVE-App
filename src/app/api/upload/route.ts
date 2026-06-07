import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const customPath = formData.get("path") as string || "temp";

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

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
    const storagePath = `${customPath}/${uniqueFilename}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from("business-images")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("business-images")
      .getPublicUrl(storagePath);

    return NextResponse.json({ success: true, url: publicUrl, path: storagePath });
  } catch (error) {
    console.error("Error in upload endpoint:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
