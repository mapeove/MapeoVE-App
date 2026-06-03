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
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
