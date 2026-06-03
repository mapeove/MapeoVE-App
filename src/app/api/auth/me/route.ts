import { NextRequest, NextResponse } from "next/server";
import { verify } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get("mapeove-session")?.value;
    if (!cookie) {
      return NextResponse.json({ success: true, user: null });
    }

    const payload = verify(cookie);
    if (!payload) {
      return NextResponse.json({ success: true, user: null });
    }

    return NextResponse.json({ success: true, user: payload });
  } catch (error) {
    console.error("Error en me route:", error);
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}
