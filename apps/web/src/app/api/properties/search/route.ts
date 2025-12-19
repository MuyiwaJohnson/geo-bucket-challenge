import { NextRequest, NextResponse } from "next/server";

const BACKEND_API = process.env.API_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const location = searchParams.get("location");

    if (!location) {
      return NextResponse.json(
        { error: "Bad Request", message: "Location parameter is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_API}/api/properties/search?location=${encodeURIComponent(location)}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Failed to search properties",
        message: response.statusText,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to search properties" },
      { status: 500 }
    );
  }
}

