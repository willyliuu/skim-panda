"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Clock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface SummaryData {
  id: string;
  video: {
    title: string;
    duration: string;
  };
  createdAt: string;
}

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [summaries, setSummaries] = useState<SummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/summaries")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSummaries(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await fetch(`/api/summaries/${id}`, { method: "DELETE" });
      setSummaries(summaries.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete summary", err);
    }
  };

  const filteredSummaries = summaries.filter(s => 
    s.video?.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Your Summaries</h1>
          <p className="text-muted-foreground mt-1">Access all your previously extracted knowledge.</p>
        </div>
        
        <div className="relative w-full md:w-72 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            type="text" 
            placeholder="Search summaries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-surface border-border focus:border-primary transition-colors"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <span className="animate-spin text-4xl">🐼</span>
        </div>
      ) : filteredSummaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSummaries.map((summary) => (
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
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-md font-medium">Video</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 z-10"
                      onClick={(e) => handleDelete(e, summary.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
          <div className="text-8xl mb-6 opacity-80">😴</div>
          <h2 className="font-heading text-2xl font-bold mb-2">No summaries found</h2>
          <p className="text-muted-foreground max-w-md mb-8">
            {search ? "We couldn't find any summaries matching your search." : "You haven't summarized any videos yet. Paste a YouTube URL to get started!"}
          </p>
          {!search && (
            <Link href="/">
              <Button className="font-bold px-8 py-6 rounded-xl shadow-lg hover:scale-105 transition-transform">
                Summarize a Video
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
