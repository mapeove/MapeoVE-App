import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { resend } from "@/lib/resend";
import { getWelcomeEmailHtml } from "@/lib/email/templates/welcome-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate presence
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "El formato de correo electrónico no es válido" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // All new registrations are VISITANTE by default
    const cleanRole = "VISITANTE";

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "El correo electrónico ya está registrado" },
        { status: 400 }
      );
    }

    // Hash the password and save
    const hashedPassword = hashPassword(password);
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: cleanRole,
      },
    });

    // Send welcome email via Resend
    if (resend) {
      try {
        const emailFrom = process.env.EMAIL_FROM || "onboarding@resend.dev";
        await resend.emails.send({
          from: emailFrom,
          to: user.email,
          subject: "¡Te damos la bienvenida a MapeoVE!",
          html: getWelcomeEmailHtml({ name: user.name }),
        });
        console.log(`[Resend] Correo de bienvenida enviado a ${user.email}`);
      } catch (mailError) {
        console.error("[Resend Error] No se pudo enviar el correo de bienvenida:", mailError);
      }
    } else {
      console.log(`[Email Mock] Bienvenido a MapeoVE enviado a ${user.email}`);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json(
      { success: false, error: "Error en el servidor al registrar el usuario" },
      { status: 500 }
    );
  }
}
