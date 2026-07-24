import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const summaries = await prisma.summary.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        video: true,
      }
    });
    return NextResponse.json(summaries);
  } catch (error) {
    console.error("Fetch summaries error:", error);
    return NextResponse.json({ error: "Failed to fetch summaries" }, { status: 500 });
  }
}
