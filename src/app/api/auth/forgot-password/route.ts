import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

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
      
      // Log for recovery preparation (normally SMTP would send this)
      console.log(`[Recuperación de Contraseña] Token generado para ${normalizedEmail}: ${token}`);
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
