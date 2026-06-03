import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, successResponseWithPagination, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { verify } from "@/lib/session";


// Business type with optional distance
type BusinessWithDistance = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  phone: string | null;
  whatsapp: string | null;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  image: string | null;
  hours: string | null;
  verified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  distance?: number;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const categorySlug = searchParams.get("category");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusStr = searchParams.get("radius");
    const q = searchParams.get("q");
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const radius = radiusStr ? parseFloat(radiusStr) : undefined;
    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;

    // Build where clause
    const where: Record<string, unknown> = { active: true };

    if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (q) {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
        { city: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const total = await db.business.count({ where });

    const businesses = await db.business.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Compute distance and filter by radius if lat/lng provided
    let results: BusinessWithDistance[] = businesses.map((business) => {
      const result: BusinessWithDistance = { ...business };

      if (userLat !== undefined && userLng !== undefined) {
        const distance = haversineDistance(
          userLat,
          userLng,
          business.latitude,
          business.longitude
        );
        result.distance = roundDistance(distance);
      }

      return result;
    });

    // Filter by radius if specified
    if (radius !== undefined && userLat !== undefined && userLng !== undefined) {
      results = results.filter(
        (b) => b.distance !== undefined && b.distance <= radius
      );
    }

    // Sort by distance if lat/lng provided
    if (userLat !== undefined && userLng !== undefined) {
      results.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });
    }

    const totalPages = Math.ceil(total / limit);

    return successResponseWithPagination(results, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("Error cargando negocios:", err);
    return errorResponse("Error al cargar negocios", 500);
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

    const {
      name,
      description,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      phone,
      whatsapp,
      image,
      hours,
      categoryId,
      verified,
    } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim() === "") {
      return errorResponse("El nombre es obligatorio");
    }
    if (!address || typeof address !== "string" || address.trim() === "") {
      return errorResponse("La direccion es obligatoria");
    }
    if (latitude === undefined || typeof latitude !== "number") {
      return errorResponse("La latitud es obligatoria y debe ser un numero");
    }
    if (longitude === undefined || typeof longitude !== "number") {
      return errorResponse("La longitud es obligatoria y debe ser un numero");
    }
    if (!categoryId || typeof categoryId !== "string" || categoryId.trim() === "") {
      return errorResponse("El ID de categoria es obligatorio");
    }

    // Check category exists
    const category = await db.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return errorResponse("Categoria no encontrada", 404);
    }

    const business = await db.business.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address.trim(),
        city: city?.trim() || "La Victoria",
        state: state?.trim() || "Aragua",
        country: country?.trim() || "Venezuela",
        latitude,
        longitude,
        phone: phone?.trim() || null,
        whatsapp: whatsapp?.trim() || null,
        image: image?.trim() || null,
        hours: hours?.trim() || null,
        categoryId,
        verified: typeof verified === "boolean" ? verified : false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
      },
    });

    return successResponse(business, 201);
  } catch (err) {
    console.error("Error creando negocio:", err);
    return errorResponse("Error al crear negocio", 500);
  }
}
