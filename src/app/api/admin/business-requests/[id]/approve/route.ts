import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/resend";
import { getBusinessApprovedEmailHtml } from "@/lib/email/templates/business-approved-email";

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

    if (req.latitude === null || req.longitude === null) {
      return NextResponse.json({ error: "La solicitud no tiene coordenadas válidas para crear el negocio" }, { status: 400 });
    }

    // Create Business
    const business = await db.business.create({
      data: {
        name: req.businessName,
        categoryId: req.categoryId,
        address: req.address,
        phone: req.phone,
        whatsapp: req.whatsapp,
        description: req.description,
        hours: req.openingHours,
        ownerId: req.userId,
        latitude: req.latitude,
        longitude: req.longitude,
        city: "La Victoria",
        state: "Aragua",
        country: "Venezuela",
        verified: true,
        active: true,
        businessEmail: req.businessEmail,
        website: req.website,
        instagram: req.instagram,
        facebook: req.facebook,
        tiktok: req.tiktok,
      },
    });

    // Copy images from temporary request folder to business folder and create BusinessImage records
    if (req.images && req.images.length > 0) {
      for (let i = 0; i < req.images.length; i++) {
        const tempUrl = req.images[i];
        try {
          const urlParts = tempUrl.split("/business-images/");
          const tempPath = urlParts[1];
          if (tempPath) {
            const filename = tempPath.split("/").pop();
            const newPath = `${business.id}/${filename}`;

            // Copy file in Supabase storage
            const { error: copyError } = await supabase.storage
              .from("business-images")
              .copy(tempPath, newPath);

            if (!copyError) {
              // Delete old temp file
              await supabase.storage.from("business-images").remove([tempPath]);

              // Get public URL for new file
              const { data: { publicUrl } } = supabase.storage
                .from("business-images")
                .getPublicUrl(newPath);

              // Create BusinessImage record
              await db.businessImage.create({
                data: {
                  businessId: business.id,
                  url: publicUrl,
                  isPrimary: i === 0, // first image is primary
                },
              });
            } else {
              console.error("Error copying image on request approval:", copyError);
            }
          }
        } catch (err) {
          console.error("Error processing request image on approval:", err);
        }
      }
    }

    // Update User Role to OWNER
    await db.user.update({
      where: { id: req.userId },
      data: { role: "OWNER" },
    });

    // Update Request Status
    const updatedRequest = await db.businessRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        businessId: business.id,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    // Envío de correo de aprobación al propietario
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
            subject: "Tu negocio fue aprobado en MapeoVE",
            html: getBusinessApprovedEmailHtml({
              ownerName,
              businessName: req.businessName,
              appUrl,
            }),
          });
          console.log(`[Resend] Correo de aprobación enviado a ${recipientEmail} para el negocio ${req.businessName}`);
        } else {
          console.log(`[Email Mock] Negocio aprobado: ${req.businessName} para ${recipientEmail}`);
        }
      } else {
        console.warn(`[Warning] No se pudo enviar correo de aprobación para la solicitud ${id} porque no hay email disponible.`);
      }
    } catch (mailError) {
      console.error("[Resend Error] No se pudo enviar el correo de aprobación:", mailError);
    }

    return NextResponse.json({ success: true, request: updatedRequest, business });
  } catch (error) {
    console.error("Error approving business request:", error);
    return NextResponse.json({ error: "Error en el servidor al aprobar la solicitud" }, { status: 500 });
  }
}
