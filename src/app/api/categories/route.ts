import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { verify } from "@/lib/session";

export async function GET(_request: NextRequest) {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { businesses: { where: { active: true } } },
        },
      },
    });

    const data = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      businessCount: category._count.businesses,
      createdAt: category.createdAt,
    }));

    return successResponse(data);
  } catch (err) {
    console.error("Error cargando categorias:", err);
    return errorResponse("Error al cargar categorias", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!name || !icon || !slug) {
      return errorResponse("Faltan campos obligatorios");
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        icon: icon.trim(),
        slug: slug.trim().toLowerCase(),
      },
    });

    return successResponse(category, 201);
  } catch (err: any) {
    console.error("Error al crear categoria:", err);
    if (err.code === "P2002") {
      return errorResponse("El nombre o slug de la categoría ya existe", 400);
    }
    return errorResponse("Error interno del servidor", 500);
  }
}

