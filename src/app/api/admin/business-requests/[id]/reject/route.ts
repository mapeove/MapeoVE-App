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

    // Update Request Status to REJECTED
    const updatedRequest = await db.businessRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    return NextResponse.json({ success: true, request: updatedRequest });
  } catch (error) {
    console.error("Error rejecting business request:", error);
    return NextResponse.json({ error: "Error en el servidor al rechazar la solicitud" }, { status: 500 });
  }
}
