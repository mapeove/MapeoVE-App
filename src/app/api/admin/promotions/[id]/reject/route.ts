import { NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import { sendPromotionRejectedEmail } from "@/lib/email";

import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ success: false, error: "El motivo del rechazo es obligatorio" }, { status: 400 });
    }

    const promotion = await prisma.promotionRequest.findUnique({
      where: { id },
      include: { business: true, user: true },
    });

    if (!promotion) {
      return NextResponse.json({ success: false, error: "Promoción no encontrada" }, { status: 404 });
    }

    if (promotion.status !== "PENDING") {
      return NextResponse.json({ success: false, error: "La promoción ya fue procesada" }, { status: 400 });
    }

    const updatedPromotion = await prisma.promotionRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.userId,
        rejectionReason: rejectionReason || "Pago no verificado o datos incorrectos",
      },
    });

    try {
      if (promotion.user?.email) {
        await sendPromotionRejectedEmail(
          promotion.user.email,
          promotion.business.name,
          promotion.type,
          updatedPromotion.rejectionReason!
        );
      }
    } catch (emailError) {
      console.error("Email send failed:", emailError);
    }

    return NextResponse.json({ success: true, data: updatedPromotion });
  } catch (error) {
    console.error("Error rejecting promotion:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
