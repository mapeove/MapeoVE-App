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
    const { name, icon, slug } = body;

    const updateData: Record<string, string> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (icon !== undefined) updateData.icon = icon.trim();
    if (slug !== undefined) updateData.slug = slug.trim().toLowerCase();

    const category = await db.category.update({
      where: { id },
      data: updateData,
    });

    return successResponse(category);
  } catch (error: any) {
    console.error("Error al actualizar categoria:", error);
    if (error.code === "P2002") {
      return errorResponse("El nombre o slug de la categoría ya existe", 400);
    }
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

    // Check if there are businesses using this category
    const hasBusinesses = await db.business.findFirst({
      where: { categoryId: id },
    });

    if (hasBusinesses) {
      return errorResponse("No se puede eliminar la categoría porque tiene negocios asociados", 400);
    }

    await db.category.delete({
      where: { id },
    });

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("Error al eliminar categoria:", error);
    return errorResponse("Error en el servidor", 500);
  }
}
