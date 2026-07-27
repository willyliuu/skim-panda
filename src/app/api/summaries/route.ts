import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json([]);
    }

    const summaries = await prisma.summary.findMany({
      where: { userId: userId },
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
