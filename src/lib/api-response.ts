import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function successResponseWithPagination<T>(
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  status = 200
): NextResponse {
  return NextResponse.json({ success: true, data, pagination }, { status });
}

export function errorResponse(error: string, status = 400): NextResponse {
  return NextResponse.json({ success: false, error }, { status });
}

export function notFoundResponse(entity = "Resource"): NextResponse {
  return NextResponse.json(
    { success: false, error: `${entity} not found` },
    { status: 404 }
  );
}
