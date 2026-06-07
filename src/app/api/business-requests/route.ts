import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { resend } from "@/lib/resend";

function normalizeUrl(url: string | null | undefined, type: "web" | "instagram" | "facebook" | "tiktok"): string | null {
  if (!url || !url.trim()) return null;
  let clean = url.trim();

  if (type === "web") {
    if (!/^https?:\/\//i.test(clean)) {
      clean = "https://" + clean;
    }
    return clean;
  }

  if (type === "instagram") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("@")) {
      clean = clean.substring(1);
    }
    if (clean.includes("instagram.com")) {
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://instagram.com/${clean}`;
  }

  if (type === "tiktok") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("@")) {
      clean = clean.substring(1);
    }
    if (clean.includes("tiktok.com")) {
      const path = clean.split("tiktok.com/")[1];
      if (path && !path.startsWith("@")) {
        return `https://tiktok.com/@${path}`;
      }
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://tiktok.com/@${clean}`;
  }

  if (type === "facebook") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.includes("facebook.com")) {
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://facebook.com/${clean}`;
  }

  return clean;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      categoryId,
      address,
      phone,
      whatsapp,
      description,
      openingHours,
      note,
      paymentMethod,
      paymentReference,
      proofImageUrl,
      plan,
      latitude,
      longitude,
      images,
      businessEmail,
      website,
      instagram,
      facebook,
      tiktok,
    } = body;

    // Validate required fields
    if (!businessName || !categoryId || !address || !phone || !whatsapp || !paymentMethod || !paymentReference || !plan) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para la solicitud" },
        { status: 400 }
      );
    }
    // Validate plan
    if (plan !== "MONTHLY" && plan !== "YEARLY") {
      return NextResponse.json(
        { error: "Plan no válido" },
        { status: 400 }
      );
    }
    // Validate payment method is valid enum value
    if (paymentMethod !== "PAGO_MOVIL" && paymentMethod !== "TRANSFERENCIA" && paymentMethod !== "BINANCE") {
      return NextResponse.json(
        { error: "Método de pago no válido" },
        { status: 400 }
      );
    }
    // Check if category exists
    const categoryExists = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }

    // Normalize Web and Social Links
    const normWebsite = normalizeUrl(website, "web");
    const normInstagram = normalizeUrl(instagram, "instagram");
    const normFacebook = normalizeUrl(facebook, "facebook");
    const normTiktok = normalizeUrl(tiktok, "tiktok");

    // Save request to database
    const req = await db.businessRequest.create({
      data: {
        userId: session.userId,
        businessName: businessName.trim(),
        categoryId,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        description: description?.trim() || null,
        openingHours: openingHours?.trim() || null,
        note: note?.trim() || null,
        plan,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        proofImageUrl: proofImageUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: Array.isArray(images) ? images : [],
        status: "PENDING",
        businessEmail: businessEmail?.trim() || null,
        website: normWebsite,
        instagram: normInstagram,
        facebook: normFacebook,
        tiktok: normTiktok,
      },
    });

    // Fetch requester user info for notification mail
    const requester = await db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true }
    });

    const categoryName = categoryExists.name;
    const requesterName = requester?.name || "Usuario MapeoVE";
    const requesterEmail = requester?.email || "Sin email";

    // Attempt to send email via Resend
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "mapeove@gmail.com";
    const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev"; // default sandbox sender

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 30px 15px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
          <!-- Header -->
          <div style="background-color: #0B3D91; padding: 25px 30px; text-align: center; border-bottom: 3px solid #F4C430;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Nueva solicitud de negocio en MapeoVE</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px;">
            <p style="color: #333333; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 25px;">
              Se ha recibido una nueva solicitud de negocio en MapeoVE. Revisa los datos y entra al panel administrativo para aprobarla o rechazarla.
            </p>

            <!-- SECCIÓN 1 — DATOS DEL SOLICITANTE -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">1. Datos del Solicitante</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Nombre:</td>
                  <td style="padding: 6px 0; color: #111111;">${requesterName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Email:</td>
                  <td style="padding: 6px 0; color: #111111;">${requesterEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">ID Usuario:</td>
                  <td style="padding: 6px 0; color: #111111; font-family: monospace; font-size: 11px;">${session.userId}</td>
                </tr>
              </table>
            </div>

            <!-- SECCIÓN 2 — DATOS DEL NEGOCIO -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">2. Datos del Negocio</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Nombre Comercial:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: bold;">${req.businessName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Categoría:</td>
                  <td style="padding: 6px 0; color: #111111;">${categoryName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Dirección:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.address}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Teléfono:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">WhatsApp:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.whatsapp}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Email Privado:</td>
                  <td style="padding: 6px 0; color: #e12d2d; font-weight: bold;">${req.businessEmail || "No provisto"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Horario:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.openingHours || "No provisto"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Descripción:</td>
                  <td style="padding: 6px 0; color: #111111; line-height: 1.4;">${req.description || "Sin descripción"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Oferta / Nota:</td>
                  <td style="padding: 6px 0; color: #111111; font-style: italic;">${req.note || "Ninguna"}</td>
                </tr>
              </table>
            </div>

            <!-- SECCIÓN 3 — WEB Y REDES SOCIALES -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">3. Web y Redes Sociales</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Página Web:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.website ? `<a href="${req.website}" style="color: #0B3D91; text-decoration: underline;">${req.website}</a>` : "No provisto"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Instagram:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.instagram ? `<a href="${req.instagram}" style="color: #0B3D91; text-decoration: underline;">${req.instagram}</a>` : "No provisto"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Facebook:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.facebook ? `<a href="${req.facebook}" style="color: #0B3D91; text-decoration: underline;">${req.facebook}</a>` : "No provisto"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">TikTok:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.tiktok ? `<a href="${req.tiktok}" style="color: #0B3D91; text-decoration: underline;">${req.tiktok}</a>` : "No provisto"}</td>
                </tr>
              </table>
            </div>

            <!-- SECCIÓN 4 — UBICACIÓN -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">4. Ubicación</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Latitud:</td>
                  <td style="padding: 6px 0; color: #111111; font-family: monospace;">${req.latitude !== null ? req.latitude : "No especificada"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Longitud:</td>
                  <td style="padding: 6px 0; color: #111111; font-family: monospace;">${req.longitude !== null ? req.longitude : "No especificada"}</td>
                </tr>
              </table>
            </div>

            <!-- SECCIÓN 5 — SUSCRIPCIÓN / PAGO -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">5. Suscripción / Pago</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Plan elegido:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: bold;">${req.plan === "YEARLY" ? "Anual" : "Mensual"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Método de Pago:</td>
                  <td style="padding: 6px 0; color: #111111;">${req.paymentMethod}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Referencia de Pago:</td>
                  <td style="padding: 6px 0; color: #111111; font-family: monospace;">${req.paymentReference}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Fecha de Solicitud:</td>
                  <td style="padding: 6px 0; color: #111111;">${new Date(req.createdAt).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <!-- SECCIÓN 6 — ACCIÓN -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #0B3D91; padding: 15px; border-radius: 4px; font-size: 13px; color: #555555; line-height: 1.5; margin-bottom: 25px;">
              Accede al panel de administración de MapeoVE para aprobar o rechazar esta solicitud.
            </div>

            ${process.env.NEXT_PUBLIC_APP_URL ? `
            <div style="text-align: center; margin-top: 15px; margin-bottom: 10px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" target="_blank" style="background-color: #0B3D91; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                Abrir Panel de Administración
              </a>
            </div>
            ` : ""}
          </div>

          <!-- Footer -->
          <div style="background-color: #f4f5f7; padding: 15px 30px; text-align: center; font-size: 11px; color: #777777; border-top: 1px solid #e1e4e8;">
            MapeoVE © ${new Date().getFullYear()} — Plataforma de Geolocalización de Comercios
          </div>
        </div>
      </div>
    `;

    if (resend) {
      try {
        await resend.emails.send({
          from: emailFrom,
          to: adminEmail,
          subject: `🔔 Nueva solicitud de negocio - ${req.businessName}`,
          html: emailHtml,
        });
        console.log(`[Resend] Correo de notificación enviado a ${adminEmail} para ${req.businessName}`);
      } catch (error) {
        console.error("[MapeoVE Email] Error enviando notificación:", error);
      }
    } else {
      console.log(`[Email Mock] Notificación de solicitud a ${adminEmail}:
- Nombre: ${req.businessName}
- Categoría: ${categoryName}
- Dirección: ${req.address}
- Teléfono: ${req.phone}
- WhatsApp: ${req.whatsapp}
- Email privado: ${req.businessEmail}
- Web: ${req.website}
- Instagram: ${req.instagram}
- Facebook: ${req.facebook}
- TikTok: ${req.tiktok}
- Solicitante: ${requesterName} (${requesterEmail})
- Plan: ${req.plan}
- Método Pago: ${req.paymentMethod} (Ref: ${req.paymentReference})`);
    }

    return NextResponse.json({ success: true, request: req });
  } catch (error) {
    console.error("Error creating business request:", error);
    return NextResponse.json({ error: "Error en el servidor al enviar la solicitud" }, { status: 500 });
  }
}
