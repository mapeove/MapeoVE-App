import { NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { db as prisma } from "@/lib/db";

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session || !session) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      businessId, 
      type, 
      baseAmount, 
      transactionHash, 
      userNote,
      bannerTitle,
      bannerDescription,
      bannerImage,
      bannerCategory,
      bannerTemplate,
      bannerPrice 
    } = body;

    if (!businessId || !type || !baseAmount || !transactionHash) {
      return NextResponse.json({ success: false, error: "Faltan datos requeridos" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Negocio no encontrado" }, { status: 404 });
    }

    // Verify ownership
    if (business.ownerId !== session.id && session.role !== "ADMIN" && session.role !== "SUPERADMIN") {
      return NextResponse.json({ success: false, error: "No autorizado para este negocio" }, { status: 403 });
    }

    
    const paymentSettings = await prisma.paymentSettings.findFirst();
    const feeAmount = paymentSettings?.binanceFeeValue ?? 1;
    
    let calculatedBaseAmount = 0;
    switch(type) {
      case "FEATURED": calculatedBaseAmount = 5; break;
      case "SPONSORED_CATEGORY": calculatedBaseAmount = 10; break;
      case "LOCAL_BANNER": calculatedBaseAmount = 15; break;
      case "PREMIUM": calculatedBaseAmount = 5; break;
      default: return NextResponse.json({ success: false, error: "Tipo de promoción inválido" }, { status: 400 });
    }

    const totalAmount = calculatedBaseAmount + feeAmount;
    const walletAddress = paymentSettings?.binanceWallet || "0x1fded59b2460d421cc53f8256e2c7ac2ea771909";


    const promotion = await prisma.promotionRequest.create({
      data: {
        businessId,
        userId: session.id,
        type,
        status: "PENDING",
        baseAmount: calculatedBaseAmount,
        feeAmount,
        totalAmount,
        currency: "USDC",
        walletAddress,
        transactionHash,
        userNote,
        bannerTitle: type === "LOCAL_BANNER" ? bannerTitle : null,
        bannerDescription: type === "LOCAL_BANNER" ? bannerDescription : null,
        bannerImage: type === "LOCAL_BANNER" ? bannerImage : null,
        bannerCategory: type === "LOCAL_BANNER" ? bannerCategory : null,
        bannerTemplate: type === "LOCAL_BANNER" ? bannerTemplate : null,
        bannerPrice: type === "LOCAL_BANNER" ? bannerPrice : null,
      },
    });

    // Optionally send "received" email via a background task or right here
    try {
      const { sendPromotionReceivedEmail } = await import("@/lib/email");
      await sendPromotionReceivedEmail(session.email!, business.name, type);
    } catch (emailError) {
      console.error("Error sending promotion received email:", emailError);
      // Don't break the flow
    }

    return NextResponse.json({ success: true, data: promotion });
  } catch (error) {
    console.error("Error creating promotion request:", error);
    return NextResponse.json({ success: false, error: "Error de servidor al crear la solicitud" }, { status: 500 });
  }
}
