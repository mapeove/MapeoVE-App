import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const req = await db.businessRequest.findUnique({
      where: { id },
    });

    if (!req) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    if (req.status !== "PENDING") {
      return NextResponse.json({ error: "La solicitud ya ha sido revisada" }, { status: 400 });
    }

    // Create Business
    const business = await db.business.create({
      data: {
        name: req.businessName,
        categoryId: req.categoryId,
        address: req.address,
        phone: req.phone,
        whatsapp: req.whatsapp,
        description: req.description,
        hours: req.openingHours,
        ownerId: req.userId,
        latitude: 10.2268,
        longitude: -67.3312,
        city: "La Victoria",
        state: "Aragua",
        country: "Venezuela",
        verified: true,
        active: true,
      },
    });

    // Update User Role to OWNER
    await db.user.update({
      where: { id: req.userId },
      data: { role: "OWNER" },
    });

    // Update Request Status
    const updatedRequest = await db.businessRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        businessId: business.id,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    return NextResponse.json({ success: true, request: updatedRequest, business });
  } catch (error) {
    console.error("Error approving business request:", error);
    return NextResponse.json({ error: "Error en el servidor al aprobar la solicitud" }, { status: 500 });
  }
}
