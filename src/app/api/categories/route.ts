import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

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

    const data = Array.isArray(categories) ? categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      businessCount: category._count?.businesses ?? 0,
      createdAt: category.createdAt,
    })) : [];

    return successResponse(data);
  } catch (err) {
    console.error("Error cargando categorias:", err);
    return errorResponse("Error al cargar categorias", 500);
  }
}
