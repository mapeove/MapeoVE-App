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

    // Verify ownership or legitimate relationship (BusinessRequest)
    const sessionUserId = session.userId;
    let isAuthorized = false;

    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      isAuthorized = true;
    } else {
      // 1. Direct owner match
      if (business.ownerId === sessionUserId) {
        isAuthorized = true;
      } else {
        // 2. Legitimate relationship through BusinessRequest
        const businessRequest = await prisma.businessRequest.findFirst({
          where: {
            businessId: business.id,
            userId: sessionUserId,
          },
        });
        if (businessRequest) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
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
        userId: sessionUserId,
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

    // Optionally send "received" email and admin notification email
    try {
      const { sendPromotionReceivedEmail, sendPromotionAdminNotificationEmail } = await import("@/lib/email");
      // Send receipt to user
      await sendPromotionReceivedEmail(session.email!, business.name, type);
      
      // Send notification to admin/superadmin
      await sendPromotionAdminNotificationEmail({
        businessName: business.name,
        type,
        baseAmount: calculatedBaseAmount,
        feeAmount,
        totalAmount,
        transactionHash,
        userEmail: session.email!,
      });
    } catch (emailError) {
      console.error("Error sending promotion emails:", emailError);
      // Don't break the flow
    }

    return NextResponse.json({ success: true, data: promotion });
  } catch (error) {
    console.error("Error creating promotion request:", error);
    return NextResponse.json({ success: false, error: "Error de servidor al crear la solicitud" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Falta businessId" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: "Negocio no encontrado" }, { status: 404 });
    }

    const sessionUserId = session.userId;
    let isAuthorized = false;

    if (session.role === "ADMIN" || session.role === "SUPERADMIN") {
      isAuthorized = true;
    } else {
      if (business.ownerId === sessionUserId) {
        isAuthorized = true;
      } else {
        const businessRequest = await prisma.businessRequest.findFirst({
          where: {
            businessId: business.id,
            userId: sessionUserId,
          },
        });
        if (businessRequest) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "No autorizado para este negocio" }, { status: 403 });
    }

    const promotions = await prisma.promotionRequest.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: promotions });
  } catch (error) {
    console.error("Error fetching promotions for business:", error);
    return NextResponse.json({ success: false, error: "Error de servidor" }, { status: 500 });
  }
}
