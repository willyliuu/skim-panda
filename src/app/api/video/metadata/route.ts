import { NextRequest, NextResponse } from "next/server";
import { getVideoMetadata } from "@/lib/youtube";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const metadata = await getVideoMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch video metadata" }, { status: 500 });
  }
}
