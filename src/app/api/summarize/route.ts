import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVideoMetadata, extractAudio } from "@/lib/youtube";
import { transcribeAudio, summarizeTranscript } from "@/lib/ai";
import fs from "fs";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Hobby/Pro if configured

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    console.log("Fetching metadata for:", url);
    const metadata = await getVideoMetadata(url);

    const video = await prisma.videoMetadata.upsert({
      where: { youtubeId: metadata.id },
      update: {
        title: metadata.title,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
      },
      create: {
        youtubeId: metadata.id,
        url: url,
        title: metadata.title,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
      },
    });

    const summary = await prisma.summary.create({
      data: {
        videoId: video.id,
        status: "extracting",
      },
    });

    try {
      console.log("Extracting audio...");
      const audioPath = await extractAudio(url, metadata.id);

      await prisma.summary.update({
        where: { id: summary.id },
        data: { status: "transcribing" },
      });

      console.log("Transcribing audio...");
      const transcriptText = await transcribeAudio(audioPath);

      await prisma.transcript.create({
        data: {
          summaryId: summary.id,
          text: transcriptText,
        },
      });

      await prisma.summary.update({
        where: { id: summary.id },
        data: { status: "summarizing" },
      });

      console.log("Summarizing transcript...");
      const summaryData = await summarizeTranscript(transcriptText);

      await prisma.summaryResult.create({
        data: {
          summaryId: summary.id,
          quickSummary: summaryData.quickSummary,
          takeaways: JSON.stringify(summaryData.takeaways),
          sections: {
            create: summaryData.sections.map((s) => ({
              time: s.time,
              title: s.title,
              content: s.content,
            })),
          },
        },
      });

      await prisma.summary.update({
        where: { id: summary.id },
        data: { status: "completed" },
      });

      // Cleanup
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      console.log("Process complete!");
      return NextResponse.json({ success: true, summaryId: summary.id });
    } catch (innerError) {
      console.error("Pipeline error:", innerError);
      await prisma.summary.update({
        where: { id: summary.id },
        data: { status: "failed" },
      });
      return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Summarize endpoint error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
