import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVideoMetadata, extractAudio } from "@/lib/youtube";
import { transcribeAudio, summarizeTranscript } from "@/lib/ai";
import fs from "fs";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Hobby/Pro if configured

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, language = "en" } = body;

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (data: any) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          sendEvent({ status: "starting" });
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

          sendEvent({ status: "extracting" });
          console.log("Extracting audio...");
          const audioPath = await extractAudio(url, metadata.id);

          await prisma.summary.update({
            where: { id: summary.id },
            data: { status: "transcribing" },
          });

          sendEvent({ status: "transcribing" });
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

          sendEvent({ status: "summarizing" });
          console.log("Summarizing transcript...");
          const summaryData = await summarizeTranscript(transcriptText, language);

          await prisma.summaryResult.create({
            data: {
              summaryId: summary.id,
              language: language,
              quickSummary: summaryData.quickSummary,
              takeaways: JSON.stringify(summaryData.takeaways),
              sections: {
                create: summaryData.sections.map((s: any) => ({
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

          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
          }

          console.log("Process complete!");
          sendEvent({ status: "completed", summaryId: summary.id });
          controller.close();
        } catch (innerError: any) {
          console.error("Pipeline error:", innerError);
          sendEvent({ status: "error", error: innerError?.message || "Pipeline failed" });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Summarize endpoint error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
