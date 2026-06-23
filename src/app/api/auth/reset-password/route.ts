import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Validate parameters
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "El token y la contraseña son obligatorios." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres." },
        { status: 400 }
      );
    }

    // Find the token in the database
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "El token de recuperación no es válido o ya fue utilizado." },
        { status: 400 }
      );
    }

    // Verify token expiration
    if (resetToken.expiresAt < new Date()) {
      // Clean up expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      return NextResponse.json(
        { success: false, error: "El token de recuperación ha expirado." },
        { status: 400 }
      );
    }

    // Check if the user exists
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "El usuario asociado a este token no existe." },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = hashPassword(password);

    // Update user password
    await db.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete the token so it cannot be used again
    await db.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: "Tu contraseña ha sido restablecida exitosamente.",
    });
  } catch (error) {
    console.error("Error en reset-password:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al restablecer la contraseña." },
      { status: 500 }
    );
  }
}
