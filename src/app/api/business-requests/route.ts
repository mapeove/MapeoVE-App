import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { resend } from "@/lib/resend";
import { supabase } from "@/lib/supabase";

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
      latitude,
      longitude,
      images,
      businessEmail,
      website,
      instagram,
      facebook,
      tiktok,
    } = body;

    // Validate required fields (payment fields are NO LONGER required — registration is free)
    if (!businessName || !categoryId || !address || !phone || !whatsapp) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para la solicitud" },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      return NextResponse.json(
        { error: "Debes seleccionar la ubicación en el mapa" },
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

    // ──────────────────────────────────────────────────────
    // NEW FLOW: Registration is FREE — create business DIRECTLY
    // ──────────────────────────────────────────────────────

    // 1. Create the business immediately (active, NOT verified — admin verifies later)
    const business = await db.business.create({
      data: {
        name: businessName.trim(),
        categoryId,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        description: description?.trim() || null,
        hours: openingHours?.trim() || null,
        ownerId: session.userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city: "La Victoria",
        state: "Aragua",
        country: "Venezuela",
        verified: false,   // NOT verified by default — admin can verify later
        active: true,      // IMMEDIATELY visible on the map
        businessEmail: businessEmail?.trim() || null,
        website: normWebsite,
        instagram: normInstagram,
        facebook: normFacebook,
        tiktok: normTiktok,
      },
    });

    // 2. Process uploaded images — move from temp to permanent storage
    const imagesArray = Array.isArray(images) ? images : [];
    if (imagesArray.length > 0) {
      for (let i = 0; i < imagesArray.length; i++) {
        const tempUrl = imagesArray[i];
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
                  isPrimary: i === 0,
                },
              });
            } else {
              console.error("Error copying image on business creation:", copyError);
            }
          }
        } catch (err) {
          console.error("Error processing image on business creation:", err);
        }
      }
    }

    // 3. Update user role to OWNER
    await db.user.update({
      where: { id: session.userId },
      data: { role: "OWNER" },
    });

    // 4. Also create a BusinessRequest record for tracking (auto-approved)
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
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: imagesArray,
        status: "APPROVED",   // Auto-approved since it's free
        businessId: business.id,
        reviewedAt: new Date(),
        businessEmail: businessEmail?.trim() || null,
        website: normWebsite,
        instagram: normInstagram,
        facebook: normFacebook,
        tiktok: normTiktok,
      },
    });

    // 5. Send admin notification email (informational only — no approval needed)
    const requester = await db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true }
    });

    const categoryName = categoryExists.name;
    const requesterName = requester?.name || "Usuario MapeoVE";
    const requesterEmail = requester?.email || "Sin email";

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "mapeove@gmail.com";
    const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

    const adminPanelUrl =
      process.env.ADMIN_PANEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://mapeo-ve-app.vercel.app";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f5f7; padding: 30px 15px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
          <!-- Header -->
          <div style="background-color: #0B3D91; padding: 25px 30px; text-align: center; border-bottom: 3px solid #F4C430;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Nuevo negocio registrado en MapeoVE</h1>
          </div>
          
          <!-- Body -->
          <div style="padding: 30px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
              <p style="color: #166534; font-size: 13px; margin: 0; font-weight: bold;">✅ Negocio publicado automáticamente (registro gratuito)</p>
              <p style="color: #166534; font-size: 12px; margin: 4px 0 0 0;">El negocio ya es visible en el mapa. Puedes verificarlo desde el panel de administración.</p>
            </div>

            <p style="color: #333333; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 25px;">
              Se ha registrado un nuevo negocio en MapeoVE. El negocio ya está visible en el mapa como <strong>No Verificado</strong>.
            </p>

            <!-- Datos del Solicitante -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">1. Datos del Propietario</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Nombre:</td>
                  <td style="padding: 6px 0; color: #111111;">${requesterName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Email:</td>
                  <td style="padding: 6px 0; color: #111111;">${requesterEmail}</td>
                </tr>
              </table>
            </div>

            <!-- Datos del Negocio -->
            <div style="margin-bottom: 25px;">
              <h3 style="color: #0B3D91; border-bottom: 2px solid #e1e4e8; padding-bottom: 6px; margin-top: 0; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">2. Datos del Negocio</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #666666; width: 150px; font-weight: bold;">Nombre:</td>
                  <td style="padding: 6px 0; color: #111111; font-weight: bold;">${business.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Categoría:</td>
                  <td style="padding: 6px 0; color: #111111;">${categoryName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Dirección:</td>
                  <td style="padding: 6px 0; color: #111111;">${business.address}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #666666; font-weight: bold;">Teléfono:</td>
                  <td style="padding: 6px 0; color: #111111;">${business.phone}</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-top: 15px; margin-bottom: 10px;">
              <a href="${adminPanelUrl}" target="_blank" style="background-color: #0B3D91; color: #ffffff; padding: 12px 24px; text-decoration: none; font-size: 13px; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                Abrir Panel de Administración
              </a>
            </div>
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
          subject: `🆕 Nuevo negocio registrado - ${business.name}`,
          html: emailHtml,
        });
        console.log(`[Resend] Notificación de nuevo negocio enviada a ${adminEmail} para ${business.name}`);
      } catch (error) {
        console.error("[MapeoVE Email] Error enviando notificación:", error);
      }
    } else {
      console.log(`[Email Mock] Nuevo negocio registrado: ${business.name} por ${requesterName} (${requesterEmail})`);
    }

    return NextResponse.json({ success: true, request: req, business });
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json({ error: "Error en el servidor al registrar el negocio" }, { status: 500 });
  }
}
