import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verify } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("mapeove-session")?.value;
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const session = verify(token);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const requests = await db.businessRequest.findMany({
      where: { userId: session.userId },
      include: {
        category: {
          select: {
            name: true,
            icon: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching my business requests:", error);
    return NextResponse.json({ error: "Error en el servidor al obtener las solicitudes" }, { status: 500 });
  }
}
