import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get("mapeove-session")?.value;
    if (!cookie) {
      return errorResponse("No autorizado", 401);
    }
    const sessionUser = verify(cookie);
    if (!sessionUser || sessionUser.role !== "SUPER_ADMIN") {
      return errorResponse("Permiso denegado. Se requiere SUPER_ADMIN", 403);
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });

    return successResponse(users);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return errorResponse("Error en el servidor", 500);
  }
}
