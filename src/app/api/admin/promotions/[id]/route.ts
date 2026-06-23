import { NextResponse } from "next/server";
import { verify } from "@/lib/session";
import { db as prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const token = req.cookies?.get("mapeove-session")?.value || (req as any).headers?.get("cookie")?.split("mapeove-session=")[1]?.split(";")[0];
    const session = token ? verify(token) : null;
    if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN" && session.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }

    await prisma.promotionRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting promotion request:", error);
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 });
  }
}
