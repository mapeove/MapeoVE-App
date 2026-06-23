import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      binanceWallet,
      binanceInfo,
      binanceFeeValue,
      pagoMovilInfo
    } = body;

    const existingSettings = await db.paymentSettings.findFirst();

    const dataToSave = {
      monthlyPrice: 0,
      yearlyPrice: 0,
      currency: "USDC",
      pagoMovilInfo: pagoMovilInfo || "Envía exactamente el total indicado en USDC por la red BNB Smart Chain (BEP20). El monto incluye 1 USD de comisión operativa. Después de pagar, coloca el hash o comprobante de la transacción. Tu promoción será revisada y activada en un plazo máximo de 5 horas.",
      transferInfo: "",
      binanceInfo: binanceInfo || "",
      binanceNetwork: "BNB Smart Chain (BEP20)",
      binanceWallet: binanceWallet || "",
      binanceFeeType: "FIXED" as any,
      binanceFeeValue: binanceFeeValue != null ? Number(binanceFeeValue) : 1,
    };

    let settings;
    if (existingSettings) {
      settings = await db.paymentSettings.update({
        where: { id: existingSettings.id },
        data: dataToSave,
      });
    } else {
      settings = await db.paymentSettings.create({
        data: dataToSave,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json({ error: "Error en el servidor al guardar la configuración" }, { status: 500 });
  }
}
