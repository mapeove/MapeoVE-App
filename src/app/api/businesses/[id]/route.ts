import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
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
  images: string[];
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
  ownerId?: string | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const business = await db.business.findUnique({
      where: { id },
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

    if (!business || !business.active) {
      return notFoundResponse("Business");
    }

    // Check for lat/lng query params to compute distance
    const { searchParams } = request.nextUrl;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const result: BusinessWithDistance = { ...business };

    if (lat && lng) {
      const distance = haversineDistance(
        parseFloat(lat),
        parseFloat(lng),
        business.latitude,
        business.longitude
      );
      result.distance = roundDistance(distance);
    }

    return successResponse(result);
  } catch (err) {
    console.error("Error fetching business:", err);
    return errorResponse("Failed to fetch business", 500);
  }
}

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
    if (!sessionUser) {
      return errorResponse("Sesión inválida o expirada", 401);
    }

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse("Business");
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
      images,
      hours,
      categoryId,
      verified,
      active,
      ownerId,
    } = body;

    // Build update data object based on permissions
    const updateData: Record<string, unknown> = {};

    if (sessionUser.role === "SUPER_ADMIN") {
      // If categoryId is being updated, verify it exists
      if (categoryId && categoryId !== existing.categoryId) {
        const category = await db.category.findUnique({ where: { id: categoryId } });
        if (!category) {
          return errorResponse("Category not found", 404);
        }
      }

      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (address !== undefined) updateData.address = address.trim();
      if (city !== undefined) updateData.city = city.trim();
      if (state !== undefined) updateData.state = state.trim();
      if (country !== undefined) updateData.country = country.trim();
      if (latitude !== undefined) updateData.latitude = latitude;
      if (longitude !== undefined) updateData.longitude = longitude;
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (whatsapp !== undefined) updateData.whatsapp = whatsapp?.trim() || null;
      if (image !== undefined) updateData.image = image?.trim() || null;
      if (images !== undefined) updateData.images = images;
      if (hours !== undefined) updateData.hours = hours?.trim() || null;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (verified !== undefined) updateData.verified = verified;
      if (active !== undefined) updateData.active = active;
      if (ownerId !== undefined) updateData.ownerId = ownerId || null;
    } else if (sessionUser.role === "OWNER") {
      if (existing.ownerId !== sessionUser.userId) {
        return errorResponse("No tienes permiso para editar este negocio", 403);
      }
      // Can only edit phone, whatsapp, image, images, hours
      if (phone !== undefined) updateData.phone = phone?.trim() || null;
      if (whatsapp !== undefined) updateData.whatsapp = whatsapp?.trim() || null;
      if (image !== undefined) updateData.image = image?.trim() || null;
      if (images !== undefined) updateData.images = images;
      if (hours !== undefined) updateData.hours = hours?.trim() || null;
    } else {
      return errorResponse("Permiso denegado", 403);
    }

    const business = await db.business.update({
      where: { id },
      data: updateData,
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

    return successResponse(business);
  } catch (err) {
    console.error("Error updating business:", err);
    return errorResponse("Failed to update business", 500);
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

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse("Business");
    }

    // Soft delete by setting active to false
    const business = await db.business.update({
      where: { id },
      data: { active: false },
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

    return successResponse(business);
  } catch (err) {
    console.error("Error deleting business:", err);
    return errorResponse("Failed to delete business", 500);
  }
}

