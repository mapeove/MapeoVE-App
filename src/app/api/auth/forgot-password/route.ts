import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { resend } from "@/lib/resend";
import { getResetPasswordEmailHtml } from "@/lib/email/templates/reset-password-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico es obligatorio" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "El formato del correo electrónico no es válido" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if the user exists
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      // Generate a secure reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

      // Delete any previous tokens for this email to clean up
      await db.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });

      // Save token in the database
      await db.passwordResetToken.create({
        data: {
          email: normalizedEmail,
          token,
          expiresAt,
        },
      });
      
      // Log for recovery preparation
      console.log(`[Recuperación de Contraseña] Token generado para ${normalizedEmail}: ${token}`);

      // Send reset password email via Resend
      if (resend) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mapeove.com";
          const resetUrl = `${appUrl}/reset-password?token=${token}`;
          const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";

          await resend.emails.send({
            from: emailFrom,
            to: normalizedEmail,
            subject: "Restablece tu contraseña de MapeoVE",
            html: getResetPasswordEmailHtml({
              identifier: user.name || normalizedEmail,
              resetUrl,
            }),
          });
          console.log(`[Resend] Correo de recuperación enviado a ${normalizedEmail}`);
        } catch (mailError) {
          console.error("[Resend Error] No se pudo enviar el correo de recuperación:", mailError);
        }
      } else {
        console.log(`[Email Mock] Enlace de recuperación para ${normalizedEmail}: https://mapeove.com/reset-password?token=${token}`);
      }
    }

    // Always return success with the same message to prevent user enumeration
    return NextResponse.json({
      success: true,
      message: "Si el correo existe, se generará una solicitud de recuperación.",
    });
  } catch (error) {
    console.error("Error en forgot-password:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al procesar la solicitud" },
      { status: 500 }
    );
  }
}
