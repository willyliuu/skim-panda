import { create } from "youtube-dl-exec";
import path from "path";
import os from "os";
import fs from "fs";

const binaryPath = path.join(process.cwd(), "node_modules", "youtube-dl-exec", "bin", "yt-dlp");
const youtubedl = create(binaryPath);

export async function getVideoMetadata(url: string) {
  try {
    const output = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true,
    });
    
    return {
      id: output.id,
      title: output.title,
      duration: output.duration_string || `${Math.floor(output.duration / 60)}:${(output.duration % 60).toString().padStart(2, '0')}`,
      thumbnail: output.thumbnail,
      channel: output.uploader,
      url: url
    };
  } catch (error) {
    console.error("Error fetching video metadata:", error);
    throw new Error("Failed to fetch video metadata");
  }
}

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function extractAudio(url: string, id: string): Promise<string> {
  const tmpDir = os.tmpdir();
  const rawPath = path.join(tmpDir, `${id}_raw.m4a`);
  const outputPath = path.join(tmpDir, `${id}.m4a`);
  
  if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
  if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

  try {
    await youtubedl(url, {
      extractAudio: true,
      audioFormat: "m4a",
      output: rawPath,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
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
