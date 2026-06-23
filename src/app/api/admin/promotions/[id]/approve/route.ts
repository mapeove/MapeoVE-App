import { NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import { sendPromotionApprovedEmail } from "@/lib/email";

import { NextRequest } from "next/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session || !session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const promotion = await prisma.promotionRequest.findUnique({
      where: { id: params.id },
      include: { business: true, user: true },
    });

    if (!promotion) {
      return NextResponse.json({ success: false, error: "Promoción no encontrada" }, { status: 404 });
    }

    if (promotion.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "La promoción ya fue procesada" }, { status: 400 });
    }

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Update promotion request
    const updatedPromotion = await prisma.promotionRequest.update({
      where: { id: params.id },
      data: {
        status: "APPROVED",
        startsAt,
        expiresAt,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    // Update business fields based on type
    const businessUpdateData: any = {};
    if (promotion.type === "FEATURED") {
      businessUpdateData.featured = true;
      businessUpdateData.featuredUntil = expiresAt;
    } else if (promotion.type === "SPONSORED_CATEGORY") {
      businessUpdateData.sponsoredCategory = true;
      businessUpdateData.sponsoredUntil = expiresAt;
    } else if (promotion.type === "LOCAL_BANNER") {
      businessUpdateData.promotionUntil = expiresAt;
      businessUpdateData.promotionTitle = promotion.bannerTitle || "Oferta Especial";
      businessUpdateData.promotionDescription = promotion.bannerDescription || "";
      businessUpdateData.promotionImage = promotion.bannerImage || null;
      businessUpdateData.promotionCategory = promotion.bannerCategory || null;
      businessUpdateData.promotionTemplate = promotion.bannerTemplate || null;
      businessUpdateData.promotionPrice = promotion.bannerPrice || null;
    } else if (promotion.type === "PREMIUM") {
      businessUpdateData.planType = "PREMIUM";
      businessUpdateData.premiumUntil = expiresAt;
    }

    await prisma.business.update({
      where: { id: promotion.businessId },
      data: businessUpdateData,
    });

    // Send Email
    try {
      if (promotion.user?.email) {
        await sendPromotionApprovedEmail(
          promotion.user.email,
          promotion.business.name,
          promotion.type,
          startsAt,
          expiresAt
        );
      }
    } catch (emailError) {
      console.error("Email send failed:", emailError);
    }

    return NextResponse.json({ success: true, data: updatedPromotion });
  } catch (error) {
    console.error("Error approving promotion:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
