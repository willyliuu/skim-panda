import { prisma } from "./src/lib/prisma";

async function main() {
  console.log("Starting...");
  const metadata = {
    id: "CEIFOcTVJlo",
    title: "Test Title",
    duration: "10:00",
    thumbnail: "http://example.com/thumb.jpg",
    channel: "Test Channel"
  };
  
  try {
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
        url: "https://www.youtube.com/watch?v=CEIFOcTVJlo",
        title: metadata.title,
        duration: metadata.duration,
        thumbnail: metadata.thumbnail,
        channel: metadata.channel,
      },
    });
    console.log("Success:", video);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
main();
