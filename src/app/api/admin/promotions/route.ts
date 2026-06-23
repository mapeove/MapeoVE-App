import { NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { db as prisma } from "@/lib/db";

import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session || !session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const promotions = await prisma.promotionRequest.findMany({
      where: whereClause,
      include: {
        business: { select: { name: true, city: true } },
        user: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: promotions });
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
