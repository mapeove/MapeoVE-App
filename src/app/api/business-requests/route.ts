import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      categoryId,
      address,
      phone,
      whatsapp,
      description,
      openingHours,
      note,
      paymentMethod,
      paymentReference,
      proofImageUrl,
      plan,
      latitude,
      longitude,
      images,
    } = body;

    // Validate required fields
    if (!businessName || !categoryId || !address || !phone || !whatsapp || !paymentMethod || !paymentReference || !plan) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios para la solicitud" },
        { status: 400 }
      );
    }
    // Validate plan
    if (plan !== "MONTHLY" && plan !== "YEARLY") {
      return NextResponse.json(
        { error: "Plan no válido" },
        { status: 400 }
      );
    }
    // Validate payment method is valid enum value
    if (paymentMethod !== "PAGO_MOVIL" && paymentMethod !== "TRANSFERENCIA" && paymentMethod !== "BINANCE") {
      return NextResponse.json(
        { error: "Método de pago no válido" },
        { status: 400 }
      );
    }
    // Check if category exists
    const categoryExists = await db.category.findUnique({
      where: { id: categoryId },
    });
    if (!categoryExists) {
      return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }

    // Save request to database
    const req = await db.businessRequest.create({
      data: {
        userId: session.userId,
        businessName: businessName.trim(),
        categoryId,
        address: address.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        description: description?.trim() || null,
        openingHours: openingHours?.trim() || null,
        note: note?.trim() || null,
        plan,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        proofImageUrl: proofImageUrl || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        images: Array.isArray(images) ? images : [],
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, request: req });
  } catch (error) {
    console.error("Error creating business request:", error);
    return NextResponse.json({ error: "Error en el servidor al enviar la solicitud" }, { status: 500 });
  }
}
