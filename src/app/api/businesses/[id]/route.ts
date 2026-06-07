import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";

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

    // Auth check
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) return errorResponse("No autorizado", 401);
    const session = verify(token);
    if (!session) return errorResponse("No autorizado", 401);

    const existing = await db.business.findUnique({ where: { id } });
    if (!existing) {
      return notFoundResponse("Business");
    }

    // Permission: SUPER_ADMIN can edit any; owner can only edit their own
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isOwner = existing.ownerId === session.userId;
    if (!isSuperAdmin && !isOwner) {
      return errorResponse("No tienes permiso para editar este establecimiento", 403);
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
      active,
    } = body;

    // Validate required fields if provided
    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return errorResponse("El nombre no puede estar vacío");
    }
    if (address !== undefined && (!address || typeof address !== "string" || !address.trim())) {
      return errorResponse("La dirección no puede estar vacía");
    }
    if (latitude !== undefined && (typeof latitude !== "number" || isNaN(latitude))) {
      return errorResponse("La latitud debe ser un número válido");
    }
    if (longitude !== undefined && (typeof longitude !== "number" || isNaN(longitude))) {
      return errorResponse("La longitud debe ser un número válido");
    }

    // If categoryId is being updated, verify it exists
    if (categoryId && categoryId !== existing.categoryId) {
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category) {
        return errorResponse("Categoría no encontrada", 404);
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
    // Only super admin can change verified/active flags
    if (isSuperAdmin) {
      if (verified !== undefined) updateData.verified = verified;
      if (active !== undefined) updateData.active = active;
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
        businessImages: {
          orderBy: { isPrimary: "desc" },
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

    // Auth check — only SUPER_ADMIN can hard-delete a business
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) return errorResponse("No autorizado", 401);
    const session = verify(token);
    if (!session) return errorResponse("No autorizado", 401);
    if (session.role !== "SUPER_ADMIN") {
      return errorResponse("Solo el administrador puede eliminar establecimientos", 403);
    }

    const existing = await db.business.findUnique({
      where: { id },
      include: { businessImages: true },
    });
    if (!existing) {
      return notFoundResponse("Business");
    }

    // 1. Delete images from Supabase Storage
    for (const img of existing.businessImages) {
      try {
        // Extract the storage path from the public URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/business-images/<path>
        const urlParts = img.url.split("/business-images/");
        if (urlParts.length === 2) {
          const storagePath = urlParts[1].split("?")[0]; // strip query params
          await supabase.storage.from("business-images").remove([storagePath]);
        }
      } catch (imgErr) {
        // Log but don't fail — we still delete the DB record
        console.warn("Could not delete image from storage:", img.url, imgErr);
      }
    }

    // 2. Delete all BusinessImage records (cascade in Prisma schema handles this too,
    //    but we do it explicitly for safety)
    await db.businessImage.deleteMany({ where: { businessId: id } });

    // 3. Hard-delete the business record
    await db.business.delete({ where: { id } });

    return successResponse({ deleted: true, id });
  } catch (err) {
    console.error("Error deleting business:", err);
    // If there's a FK constraint from other relations, report it clearly
    return errorResponse(
      "Error al eliminar el establecimiento. Puede tener relaciones que impiden la eliminación.",
      500
    );
  }
}
