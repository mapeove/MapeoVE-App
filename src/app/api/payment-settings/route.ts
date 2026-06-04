import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const settings = await db.paymentSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ success: true, settings: null });
    }
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    return NextResponse.json({ error: "Error en el servidor al obtener configuración de pagos" }, { status: 500 });
  }
}
