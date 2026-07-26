import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY,
});

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function transcribeAudio(audioPath: string): Promise<string> {
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
    });

    let fullText = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((transcription as any).segments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fullText = (transcription as any).segments
        .map((s: any) => `[${formatTime(s.start)}] ${s.text.trim()}`)
        .join("\n");
    } else {
      fullText = transcription.text;
    }

    return fullText;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export interface SummaryData {
  quickSummary: string;
  takeaways: string[];
  sections: { time: string; title: string; content: string }[];
}

export async function summarizeTranscript(transcript: string, language: string = "en"): Promise<SummaryData> {
  const languageInstruction = language === "id" 
    ? "\nCRITICAL: Output the entire JSON content (quickSummary, takeaways, section titles, and section contents) in Indonesian." 
    : "";

  const prompt = `You are a highly capable AI assistant that summarizes video transcripts to help people learn and review faster.${languageInstruction}
I will provide you with a timestamped transcript. 
Extract the most valuable information and structure it into three parts:
1. quickSummary: A 2-3 sentence overview of the video's core message.
2. takeaways: An array of 3-5 bullet points representing the most important actionable insights.
3. sections: A breakdown of the video into logical sections, using the timestamps provided in the transcript. Each section should have a time (e.g. "0:00"), a title, and a content paragraph describing what happens in that section.

Return ONLY a valid JSON object matching exactly this structure, with no markdown code blocks or extra text:
{
  "quickSummary": "string",
  "takeaways": ["string", "string"],
  "sections": [
    { "time": "M:SS", "title": "string", "content": "string" }
  ]
}

Here is the transcript:
${transcript}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }
    
    return JSON.parse(text) as SummaryData;
  } catch (error) {
    console.error("Summarization error:", error);
    throw new Error("Failed to summarize transcript");
  }
}
