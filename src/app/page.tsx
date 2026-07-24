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
  const [isLoading, setIsLoading] = useState(false);
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
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.summaryId) {
        router.push(`/summary/${data.summaryId}`);
      } else {
        alert("Error: " + (data.error || "Unknown error"));
        setIsLoading(false);
      }
    } catch (error) {
      alert("Failed to connect to server");
      setIsLoading(false);
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
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg py-6 shadow-none"
              required
            />
            <div className="pr-2">
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
