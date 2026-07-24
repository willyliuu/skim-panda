import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const summary = await prisma.summary.findUnique({
      where: { id },
      include: {
        video: true,
        transcript: true,
        result: {
          include: {
            sections: true
          }
        }
      }
    });
    
    if (!summary) {
      return NextResponse.json({ error: "Summary not found" }, { status: 404 });
    }
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Fetch summary error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    await prisma.summary.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete summary error:", error);
    return NextResponse.json({ error: "Failed to delete summary" }, { status: 500 });
  }
}
