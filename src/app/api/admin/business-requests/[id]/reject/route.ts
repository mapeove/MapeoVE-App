import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { resend } from "@/lib/resend";
import { getBusinessRejectedEmailHtml } from "@/lib/email/templates/business-rejected-email";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const req = await db.businessRequest.findUnique({
      where: { id },
    });

    if (!req) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (req.status !== "PENDING") {
      return NextResponse.json({ error: "La solicitud ya ha sido revisada" }, { status: 400 });
    }

    // Update Request Status to REJECTED
    const updatedRequest = await db.businessRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    // Envío de correo de rechazo al propietario
    try {
      const requester = await db.user.findUnique({
        where: { id: req.userId },
        select: { name: true, email: true }
      });

      const recipientEmail = req.businessEmail || requester?.email;
      const ownerName = requester?.name || "Propietario";

      if (recipientEmail) {
        if (resend) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mapeove.com";
          const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

          await resend.emails.send({
            from: emailFrom,
            to: recipientEmail,
            subject: "Solicitud de negocio no aprobada en MapeoVE",
            html: getBusinessRejectedEmailHtml({
              ownerName,
              businessName: req.businessName,
              appUrl,
            }),
          });
          console.log(`[Resend] Correo de rechazo enviado a ${recipientEmail} para el negocio ${req.businessName}`);
        } else {
          console.log(`[Email Mock] Negocio rechazado: ${req.businessName} para ${recipientEmail}`);
        }
      } else {
        console.warn(`[Warning] No se pudo enviar correo de rechazo para la solicitud ${id} porque no hay email disponible.`);
      }
    } catch (mailError) {
      console.error("[Resend Error] No se pudo enviar el correo de rechazo:", mailError);
    }

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Error rejecting business request:", error);
    return NextResponse.json({ error: "Error en el servidor al rechazar la solicitud" }, { status: 500 });
  }
}
