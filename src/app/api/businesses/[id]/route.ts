import { db } from "@/lib/db";
import { haversineDistance, roundDistance } from "@/lib/geo";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { verify } from "@/lib/session";
import { supabase } from "@/lib/supabase";
import { formatBusinessAddress } from "@/types/mapeove";

function normalizeUrl(url: string | null | undefined, type: "web" | "instagram" | "facebook" | "tiktok"): string | null {
  if (!url || !url.trim()) return null;
  let clean = url.trim();

  if (type === "web") {
    if (!/^https?:\/\//i.test(clean)) {
      clean = "https://" + clean;
    }
    return clean;
  }

  if (type === "instagram") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("@")) {
      clean = clean.substring(1);
    }
    if (clean.includes("instagram.com")) {
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://instagram.com/${clean}`;
  }

  if (type === "tiktok") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.startsWith("@")) {
      clean = clean.substring(1);
    }
    if (clean.includes("tiktok.com")) {
      const path = clean.split("tiktok.com/")[1];
      if (path && !path.startsWith("@")) {
        return `https://tiktok.com/@${path}`;
      }
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://tiktok.com/@${clean}`;
  }

  if (type === "facebook") {
    if (/^https?:\/\//i.test(clean)) return clean;
    if (clean.includes("facebook.com")) {
      return "https://" + clean.replace(/^https?:\/\//i, "");
    }
    return `https://facebook.com/${clean}`;
  }

  return clean;
}


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
  businessEmail: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
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

    const token = request.cookies.get("mapeove-session")?.value;
    let canSeeEmail = false;
    if (token) {
      try {
        const session = verify(token);
        if (session && (session.role === "SUPER_ADMIN" || session.userId === business.ownerId)) {
          canSeeEmail = true;
        }
      } catch (e) {}
    }

    const result: BusinessWithDistance = { ...business };
    if (!canSeeEmail) {
      result.businessEmail = null;
    }

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
      businessEmail,
      website,
      instagram,
      facebook,
      tiktok,
      parish,
      sectorType,
      sectorName,
      streetType,
      streetName,
      houseNumber,
      reference,
    } = body;

    // Validate required fields if provided
    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return errorResponse("El nombre no puede estar vacío");
    }

    const cleanParish = parish === "Otra parroquia" ? null : (parish !== undefined ? (parish?.trim() || null) : undefined);
    const cleanSectorType = sectorType === "Otro" ? null : (sectorType !== undefined ? (sectorType?.trim() || null) : undefined);
    const cleanStreetType = streetType === "Otro" ? null : (streetType !== undefined ? (streetType?.trim() || null) : undefined);

    let finalAddress = address;
    if (address === undefined || address === "") {
      const finalState = state !== undefined ? state : existing.state;
      const finalCity = city !== undefined ? city : existing.city;
      const finalParish = cleanParish !== undefined ? cleanParish : existing.parish;
      const finalSectorType = cleanSectorType !== undefined ? cleanSectorType : existing.sectorType;
      const finalSectorName = sectorName !== undefined ? sectorName : existing.sectorName;
      const finalStreetType = cleanStreetType !== undefined ? cleanStreetType : existing.streetType;
      const finalStreetName = streetName !== undefined ? streetName : existing.streetName;
      const finalHouseNumber = houseNumber !== undefined ? houseNumber : existing.houseNumber;
      const finalReference = reference !== undefined ? reference : existing.reference;

      finalAddress = formatBusinessAddress({
        address: existing.address,
        state: finalState,
        city: finalCity,
        parish: finalParish,
        sectorType: finalSectorType,
        sectorName: finalSectorName,
        streetType: finalStreetType,
        streetName: finalStreetName,
        houseNumber: finalHouseNumber,
        reference: finalReference,
      });
    }

    if (finalAddress !== undefined && (!finalAddress || typeof finalAddress !== "string" || !finalAddress.trim())) {
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
    if (finalAddress !== undefined) updateData.address = finalAddress.trim();
    if (city !== undefined) updateData.city = city?.trim() || null;
    if (state !== undefined) updateData.state = state?.trim() || null;
    if (country !== undefined) updateData.country = country.trim();
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp?.trim() || null;
    if (image !== undefined) updateData.image = image?.trim() || null;
    if (hours !== undefined) updateData.hours = hours?.trim() || null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (businessEmail !== undefined) updateData.businessEmail = businessEmail?.trim() || null;
    if (website !== undefined) updateData.website = normalizeUrl(website, "web");
    if (instagram !== undefined) updateData.instagram = normalizeUrl(instagram, "instagram");
    if (facebook !== undefined) updateData.facebook = normalizeUrl(facebook, "facebook");
    if (tiktok !== undefined) updateData.tiktok = normalizeUrl(tiktok, "tiktok");
    if (cleanParish !== undefined) updateData.parish = cleanParish;
    if (cleanSectorType !== undefined) updateData.sectorType = cleanSectorType;
    if (sectorName !== undefined) updateData.sectorName = sectorName?.trim() || null;
    if (cleanStreetType !== undefined) updateData.streetType = cleanStreetType;
    if (streetName !== undefined) updateData.streetName = streetName?.trim() || null;
    if (houseNumber !== undefined) updateData.houseNumber = houseNumber?.trim() || null;
    if (reference !== undefined) updateData.reference = reference?.trim() || "";

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
