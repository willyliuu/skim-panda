"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, CheckCircle2, Search, Link as LinkIcon, PlayCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function SummaryResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [copied, setCopied] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch(`/api/summaries/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [id]);

  const handleCopy = () => {
    if (summary && summary.result) {
      navigator.clipboard.writeText(summary.result.quickSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <span className="animate-spin text-4xl">🐼</span>
      </div>
    );
  }

  if (!summary || summary.error || !summary.result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <div className="text-8xl mb-6 opacity-80">😴</div>
        <h2 className="font-heading text-2xl font-bold mb-2">Summary not found or processing</h2>
        <p className="text-muted-foreground mb-8">This video might still be processing or it does not exist.</p>
        <Link href="/">
          <Button className="font-bold px-8 py-6 rounded-xl">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const { video, result, transcript } = summary;
  let takeaways = [];
  try {
    takeaways = JSON.parse(result.takeaways);
  } catch (e) {
    takeaways = [];
  }

  // Very rudimentary transcript lines mapping
  const transcriptLines = transcript?.text?.split('\n').filter((l: string) => l.trim().length > 0) || [];
  const filteredTranscript = transcriptLines.filter((l: string) => l.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 max-w-5xl">
      {/* Video Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8 items-start">
        <div className="w-full md:w-1/3 aspect-video bg-muted rounded-xl flex items-center justify-center text-4xl overflow-hidden relative shadow-lg">
          {video.thumbnail ? (
            <Image 
              src={video.thumbnail} 
              alt={video.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-surface flex items-center justify-center text-6xl">
              🐼
            </div>
          )}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider">Video</span>
            <span className="text-muted-foreground text-sm font-mono">{video.duration}</span>
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">{video.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <PlayCircle className="h-4 w-4" />
            <span>{video.channel || "Unknown Channel"}</span>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={handleCopy} className="gap-2 shadow-sm hover:shadow-md">
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Summary"}
            </Button>
            <Link href={video.url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="gap-2 border-border hover:bg-surface-elevated">
                <LinkIcon className="h-4 w-4" />
                Original Video
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full justify-start border-b border-border rounded-none h-auto p-0 bg-transparent mb-8 overflow-x-auto">
          <TabsTrigger 
            value="summary" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-medium text-base"
          >
            🧠 AI Summary
          </TabsTrigger>
          <TabsTrigger 
            value="transcript"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 font-medium text-base"
          >
            📝 Full Transcript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-8 animate-in fade-in-50 duration-500">
          {/* Quick Summary */}
          <Card className="bg-gradient-to-br from-surface to-surface-elevated border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-primary flex items-center gap-2">
                <SparklesIcon /> Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {result.quickSummary}
              </p>
            </CardContent>
          </Card>

          {/* Key Takeaways */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-secondary" /> Key Takeaways
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {takeaways.map((point: string, i: number) => (
                  <li key={i} className="flex gap-3 text-base">
                    <span className="text-accent flex-shrink-0 mt-1">✦</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Section Breakdown */}
          <div>
            <h3 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
              <ListIcon /> Section Breakdown
            </h3>
            <div className="space-y-4">
              {result.sections.map((section: any, i: number) => (
                <Card key={i} className="border-border/40 hover:border-border transition-colors">
                  <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start">
                    <div className="bg-muted px-2 py-1 rounded font-mono text-sm text-primary flex-shrink-0 flex items-center gap-1 cursor-pointer hover:bg-primary/20 transition-colors">
                      <PlayCircle className="h-3 w-3" /> {section.time}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{section.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript" className="animate-in fade-in-50 duration-500">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row flex-wrap gap-4 items-center justify-between border-b border-border/50 pb-4">
              <CardTitle className="font-heading text-xl">Transcript</CardTitle>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted border-none rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-6 space-y-6 scrollbar-thin">
                {filteredTranscript.map((line: string, i: number) => {
                  const match = line.match(/^\[(.*?)\] (.*)$/);
                  const time = match ? match[1] : "";
                  const text = match ? match[2] : line;
                  return (
                    <div key={i} className="flex gap-4 group">
                      {time && (
                        <span className="font-mono text-sm text-muted-foreground group-hover:text-primary cursor-pointer w-12 flex-shrink-0 transition-colors">
                          {time}
                        </span>
                      )}
                      <p className="text-foreground/90 leading-relaxed text-base">
                        {text}
                      </p>
                    </div>
                  );
                })}
                {filteredTranscript.length === 0 && (
                  <div className="text-center text-muted-foreground py-10">No transcript lines found</div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple icons for the UI
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  );
}
