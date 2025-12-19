import { NextRequest, NextResponse } from "next/server";

const BACKEND_API = process.env.API_URL || "http://localhost:3001";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_API}/api/geo-buckets/stats`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Failed to fetch bucket stats",
        message: response.statusText,
      }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch bucket stats",
      },
      { status: 500 }
    );
  }
}
