import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";

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
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (!q || q.trim() === "") {
      return errorResponse("Search query 'q' is required");
    }

    const searchTerm = q.trim();

    const businesses = await db.business.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { address: { contains: searchTerm, mode: "insensitive" } },
          { city: { contains: searchTerm, mode: "insensitive" } },
        ],
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
      orderBy: { name: "asc" },
      take: 50,
    });

    const userLat = lat ? parseFloat(lat) : undefined;
    const userLng = lng ? parseFloat(lng) : undefined;

    const results: BusinessWithDistance[] = businesses.map((business) => {
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

    return successResponse(results);
  } catch (err) {
    console.error("Error searching businesses:", err);
    return errorResponse("Failed to search businesses", 500);
  }
}
