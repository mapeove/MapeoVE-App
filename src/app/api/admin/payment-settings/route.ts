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
      monthlyPrice, 
      yearlyPrice, 
      currency, 
      pagoMovilInfo, 
      transferInfo, 
      binanceInfo,
      binanceNetwork,
      binanceWallet,
      binanceFeeType,
      binanceFeeValue
    } = body;

    if (monthlyPrice == null || yearlyPrice == null || !currency || !pagoMovilInfo || !transferInfo || !binanceInfo) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const existingSettings = await db.paymentSettings.findFirst();

    const validFeeType = binanceFeeType === "FIXED" || binanceFeeType === "PERCENTAGE" ? binanceFeeType : null;

    let settings;
    if (existingSettings) {
      settings = await db.paymentSettings.update({
        where: { id: existingSettings.id },
        data: {
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          currency,
          pagoMovilInfo,
          transferInfo,
          binanceInfo,
          binanceNetwork: binanceNetwork || null,
          binanceWallet: binanceWallet || null,
          binanceFeeType: validFeeType,
          binanceFeeValue: binanceFeeValue != null ? Number(binanceFeeValue) : null,
        },
      });
    } else {
      settings = await db.paymentSettings.create({
        data: {
          monthlyPrice: Number(monthlyPrice),
          yearlyPrice: Number(yearlyPrice),
          currency,
          pagoMovilInfo,
          transferInfo,
          binanceInfo,
          binanceNetwork: binanceNetwork || null,
          binanceWallet: binanceWallet || null,
          binanceFeeType: validFeeType,
          binanceFeeValue: binanceFeeValue != null ? Number(binanceFeeValue) : null,
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    return NextResponse.json({ error: "Error en el servidor al guardar la configuración" }, { status: 500 });
  }
}
