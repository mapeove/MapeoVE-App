import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookie = request.cookies.get("mapeove-session")?.value;
    if (!cookie) {
      return errorResponse("No autorizado", 401);
    }
    const sessionUser = verify(cookie);
    if (!sessionUser || sessionUser.role !== "SUPER_ADMIN") {
      return errorResponse("Permiso denegado. Se requiere SUPER_ADMIN", 403);
    }

    const body = await request.json();
    const { role, name } = body;

    // Prevent modifying one's own role to avoid self-lockout
    if (id === sessionUser.userId && role && role !== "SUPER_ADMIN") {
      return errorResponse("No puedes degradar tu propio rol de SUPER_ADMIN", 400);
    }

    const updateData: Record<string, string> = {};
    if (role && ["VISITANTE", "OWNER", "SUPER_ADMIN"].includes(role)) {
      updateData.role = role;
    }
    if (name) {
      updateData.name = name.trim();
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return errorResponse("Error en el servidor", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const cookie = request.cookies.get("mapeove-session")?.value;
    if (!cookie) {
      return errorResponse("No autorizado", 401);
    }
    const sessionUser = verify(cookie);
    if (!sessionUser || sessionUser.role !== "SUPER_ADMIN") {
      return errorResponse("Permiso denegado. Se requiere SUPER_ADMIN", 403);
    }

    // Prevent self deletion
    if (id === sessionUser.userId) {
      return errorResponse("No puedes eliminar tu propio usuario administrador", 400);
    }

    await db.user.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return errorResponse("Error en el servidor", 500);
  }
}
