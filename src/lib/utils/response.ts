import { NextResponse } from "next/server";

export function successResponse(data: any = null, message = "Success", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

export function errorResponse(message = "Error", status = 400, errors: any = null) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    { status }
  );
}
