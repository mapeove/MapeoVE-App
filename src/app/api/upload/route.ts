import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const businessId = formData.get("businessId") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Archivo no encontrado" }, { status: 400 });
    }

    const supabase = getSupabase();
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(fileName);

    const img = await db.businessImage.create({
      data: {
        imageUrl: publicUrlData.publicUrl,
        storagePath: fileName,
        businessId: businessId || "",
      },
    });

    return NextResponse.json({ success: true, url: img.imageUrl, id: img.id });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}
