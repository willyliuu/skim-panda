import { YoutubeTranscript } from "youtube-transcript";
import path from "path";
import os from "os";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export function getVideoId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : "";
}

export async function getVideoMetadata(url: string) {
  const id = getVideoId(url);

  // 1. Try YouTube oEmbed API (Fast, pure HTTP, zero external binaries, works on Vercel)
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        id: id || "video",
        title: data.title || "YouTube Video",
        duration: "N/A",
        thumbnail: data.thumbnail_url || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""),
        channel: data.author_name || "YouTube Channel",
        url: url
      };
    }
  } catch (err) {
    console.warn("oEmbed fetch failed, attempting fallback...", err);
  }

  // 2. Fallback to youtube-dl-exec if binary exists in local environment
  try {
    const { create } = await import("youtube-dl-exec");
    const binaryPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp");
    const youtubedl = create(binaryPath);

    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      callHome: false,
      noCheckCertificates: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });

    return {
      id: output.id || id || "",
      title: output.title || "Unknown Title",
      duration: output.duration_string || `${Math.floor((output.duration || 0) / 60)}:${((output.duration || 0) % 60).toString().padStart(2, '0')}`,
      thumbnail: output.thumbnail || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""),
      channel: output.uploader || "YouTube Channel",
      url: url
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    if (id) {
      return {
        id,
        title: "YouTube Video",
        duration: "N/A",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        channel: "YouTube Channel",
        url
      };
    }
    throw new Error("Failed to fetch video metadata");
  }
}

export async function fetchDirectTranscript(videoIdOrUrl: string): Promise<string> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoIdOrUrl);
    if (items && items.length > 0) {
      return items.map((item) => item.text).join(" ");
    }
  } catch (error) {
    console.warn("Direct transcript fetch failed:", error);
  }
  return "";
}

export async function extractAudio(url: string, id: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const rawPath = path.join(tmpDir, `${id}_raw.m4a`);
  const outputPath = path.join(tmpDir, `${id}.m4a`);

  if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  try {
    const { create } = await import("youtube-dl-exec");
    const binaryPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp");
    const youtubedl = create(binaryPath);

    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "m4a",
      output: rawPath,
      noWarnings: true,
      callHome: false,
      noCheckCertificates: true,
    });

    // Manually compress to guarantee tiny file size for Groq
    await execAsync(`ffmpeg -i "${rawPath}" -ar 16000 -ac 1 -b:a 16k "${outputPath}" -y`);

    // Cleanup raw
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);

    return outputPath;
  } catch (error) {
    console.error("Error extracting audio:", error);
    throw new Error("Failed to extract audio");
  }
}

