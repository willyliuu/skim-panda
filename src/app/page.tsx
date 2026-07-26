"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon, Sparkles, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SummaryData {
  id: string;
  video: {
    title: string;
    duration: string;
  };
  createdAt: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/summaries")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRecentSummaries(data.slice(0, 3));
        }
      })
      .catch(console.error);
  }, []);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    setIsLoading(true);
    setStatus("starting");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, language })
      });
      
      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.status) setStatus(data.status);
              if (data.status === "completed" && data.summaryId) {
                router.push(`/summary/${data.summaryId}`);
                return;
              }
              if (data.status === "error") {
                alert("Error: " + data.error);
                setIsLoading(false);
                setStatus("idle");
                return;
              }
            } catch (e) { /* ignore parse error on incomplete chunks */ }
          }
        }
      }
    } catch (error) {
      alert("Failed to connect to server");
      setIsLoading(false);
      setStatus("idle");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Hero Section */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-8 mb-16 mt-8">
        <div className="relative">
          {/* Mock Mascot */}
          <div className="text-8xl mb-4 animate-bounce">🐼</div>
          <div className="absolute -top-4 -right-8 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
            Beta!
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="font-heading text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Skim smarter. <br />
            <span className="text-primary">Watch less. Know more.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste a YouTube URL and let SkimPanda instantly extract, transcribe, and distill the key insights for you.
          </p>
        </div>

        {/* URL Input Form */}
        <form onSubmit={handleSummarize} className="w-full max-w-2xl relative group mt-8">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-surface border border-border rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg">
            <div className="pl-4 text-muted-foreground">
              <LinkIcon className="h-5 w-5" />
            </div>
            <Input 
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-6 shadow-none flex-1"
              required
            />
            <div className="pr-2 flex items-center border-l border-border/50 pl-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent border-0 text-muted-foreground font-medium text-sm focus:ring-0 cursor-pointer outline-none appearance-none mr-2 pr-6 relative"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23A8A29E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem top 50%', backgroundSize: '0.65rem auto' }}
              >
                <option value="en" className="bg-surface">🇺🇸 EN</option>
                <option value="id" className="bg-surface">🇮🇩 ID</option>
              </select>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="rounded-xl px-6 py-6 font-bold shadow-md hover:scale-105 transition-transform"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-xl">🐼</span> Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Summarize
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Progress UI */}
        {isLoading && (
          <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 mt-4 shadow-lg flex flex-col gap-4 text-left animate-in slide-in-from-top-4 fade-in duration-500">
            <h3 className="font-heading font-bold text-lg mb-2">Processing Video...</h3>
            
            <div className={`flex items-center gap-4 transition-all duration-300 ${['extracting', 'transcribing', 'summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${['transcribing', 'summarizing', 'completed'].includes(status) ? 'bg-success/20 text-success' : status === 'extracting' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {['transcribing', 'summarizing', 'completed'].includes(status) ? '✓' : '🎵'}
              </div>
              <span className={`font-medium ${status === 'extracting' ? 'text-primary' : ''}`}>Extracting Audio</span>
            </div>

            <div className={`flex items-center gap-4 transition-all duration-300 ${['transcribing', 'summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${['summarizing', 'completed'].includes(status) ? 'bg-success/20 text-success' : status === 'transcribing' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {['summarizing', 'completed'].includes(status) ? '✓' : '📝'}
              </div>
              <span className={`font-medium ${status === 'transcribing' ? 'text-primary' : ''}`}>Transcribing Audio</span>
            </div>

            <div className={`flex items-center gap-4 transition-all duration-300 ${['summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-success/20 text-success' : status === 'summarizing' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {status === 'completed' ? '✓' : '🧠'}
              </div>
              <span className={`font-medium ${status === 'summarizing' ? 'text-primary' : ''}`}>Summarizing Content</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Summaries Section */}
      <div className="w-full max-w-5xl mt-auto pt-16 border-t border-border/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading text-2xl font-bold">Recent Summaries</h2>
          <Link href="/history" className="text-primary hover:text-primary-light flex items-center gap-1 font-medium transition-colors">
            View All History <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentSummaries.length > 0 ? (
            recentSummaries.map((summary) => (
              <Link key={summary.id} href={`/summary/${summary.id}`}>
                <Card className="h-full bg-surface hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 group overflow-hidden cursor-pointer flex flex-col">
                  <div className="h-40 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-surface flex items-center justify-center text-5xl">
                      🐼
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded">
                      {summary.video?.duration || "0:00"}
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-md font-medium">Video</span>
                    </div>
                    <h3 className="font-heading font-bold text-lg leading-tight mb-auto group-hover:text-primary transition-colors line-clamp-2">
                      {summary.video?.title || "Unknown Title"}
                    </h3>
                    <div className="text-xs flex items-center gap-1 text-muted-foreground mt-4">
                      <Clock className="h-3 w-3" /> {new Date(summary.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-muted-foreground">
              No recent summaries found. Try summarizing a video!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
