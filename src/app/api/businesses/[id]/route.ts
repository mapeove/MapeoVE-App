import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
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
        businessImages: {
          orderBy: { isPrimary: "desc" },
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
      hours,
      categoryId,
      verified,
    } = body;

    // If categoryId is being updated, verify it exists
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return errorResponse("Category not found", 404);
      }
    }

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {};

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
    if (hours !== undefined) updateData.hours = hours?.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (verified !== undefined) updateData.verified = verified;

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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
