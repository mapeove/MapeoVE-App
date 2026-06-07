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
  businessEmail?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
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
    const radiusStr = searchParams.get("radiusKm") || searchParams.get("radius");
    const q = searchParams.get("q");
    const pageStr = searchParams.get("page") || "1";
    const limitStr = searchParams.get("limit") || "20";

    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const radiusKm = radiusStr ? parseFloat(radiusStr) : undefined;
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

    let businesses;
    let total;

    if (userLat !== undefined && userLng !== undefined) {
      // If coordinates are provided, fetch all matching active businesses to avoid pagination truncation
      businesses = await db.business.findMany({
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
          businessImages: {
            orderBy: { isPrimary: "desc" },
          },
        },
        orderBy: { name: "asc" },
      });
    } else {
      total = await db.business.count({ where });
      businesses = await db.business.findMany({
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
          businessImages: {
            orderBy: { isPrimary: "desc" },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    }

    const token = request.cookies.get("mapeove-session")?.value;
    let currentUser: { userId: string; role: string } | null = null;
    if (token) {
      try {
        const decoded = verify(token);
        if (decoded) currentUser = decoded;
      } catch (e) {}
    }

    // Compute distance and filter by radius if lat/lng provided
    let results: BusinessWithDistance[] = businesses.map((business) => {
      const result: BusinessWithDistance = { ...business };

      const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
      const isOwner = currentUser?.userId && business.ownerId === currentUser.userId;
      if (!isSuperAdmin && !isOwner) {
        result.businessEmail = null;
      }

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

    // Filter by radius if lat/lng are provided. Default radius is 20 km, capped at 50 km.
    if (userLat !== undefined && userLng !== undefined) {
      let activeRadius = 20;
      if (radiusKm !== undefined) {
        activeRadius = Math.min(50, Math.max(1, radiusKm));
      }
      results = results.filter(
        (b) => b.distance !== undefined && b.distance <= activeRadius
      );

      // Sort by distance
      results.sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        if (a.distance !== undefined) return -1;
        if (b.distance !== undefined) return 1;
        return 0;
      });

      // Update total count and slice for page/limit pagination
      total = results.length;
      results = results.slice((page - 1) * limit, page * limit);
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
