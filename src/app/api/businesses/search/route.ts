import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { verify } from "@/lib/session";

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
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const radiusStr = searchParams.get("radiusKm") || searchParams.get("radius");

    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;

    // Build where clause
    const where: Record<string, any> = { active: true };

    if (q && q.trim() !== "") {
      const searchTerm = q.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { description: { contains: searchTerm, mode: "insensitive" } },
        { address: { contains: searchTerm, mode: "insensitive" } },
        { city: { contains: searchTerm, mode: "insensitive" } },
      ];
    } else if (userLat === undefined || userLng === undefined) {
      return errorResponse("Debe proporcionar un parámetro de búsqueda 'q' o coordenadas 'lat' y 'lng'");
    }

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
        businessImages: {
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const userLatNum = userLat;
    const userLngNum = userLng;

    const token = request.cookies.get("mapeove-session")?.value;
    let currentUser: { userId: string; role: string } | null = null;
    if (token) {
      try {
        const decoded = verify(token);
        if (decoded) currentUser = decoded;
      } catch (e) {}
    }

    let results: BusinessWithDistance[] = businesses.map((business) => {
      const result: BusinessWithDistance = { ...business };

      const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";
      const isOwner = currentUser?.userId && business.ownerId === currentUser.userId;
      if (!isSuperAdmin && !isOwner) {
        result.businessEmail = null;
      }

      if (userLatNum !== undefined && userLngNum !== undefined) {
        const distance = haversineDistance(
          userLatNum,
          userLngNum,
          business.latitude,
          business.longitude
        );
        result.distance = roundDistance(distance);
      }

      return result;
    });

    // Filter by radius if lat/lng are provided. Default radius is 20 km, capped at 50 km.
    if (userLatNum !== undefined && userLngNum !== undefined) {
      let activeRadius = 20;
      if (radiusStr) {
        activeRadius = Math.min(50, Math.max(1, parseFloat(radiusStr) || 20));
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
    }

    // Limit search results to 50
    const finalResults = results.slice(0, 50);

    return successResponse(finalResults);
  } catch (err) {
    console.error("Error buscando negocios:", err);
    return errorResponse("Error al buscar negocios", 500);
  }
}
