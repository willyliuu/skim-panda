"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LinkIcon, Sparkles, Clock, ArrowRight, Check, Zap, Globe, AlignLeft, Shield, Video, FastForward, Download } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface SummaryData {
  id: string;
  video: {
    title: string;
    duration: string;
    thumbnail?: string;
  };
  createdAt: string;
}

export default function Home() {
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [recentSummaries, setRecentSummaries] = useState<SummaryData[]>([]);
  const [hasUsedFreeSummary, setHasUsedFreeSummary] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check guest usage
    const usage = localStorage.getItem("skim_guest_usage");
    if (usage && parseInt(usage, 10) >= 1) {
      setHasUsedFreeSummary(true);
    }

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
    
    if (!session && hasUsedFreeSummary) {
      setShowSignupModal(true);
      return;
    }
    
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
                localStorage.setItem("skim_guest_usage", "1");
                setHasUsedFreeSummary(true);
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
    <div className="flex-1 flex flex-col items-center justify-start w-full">
      {/* Hero Section */}
      <section className="w-full max-w-4xl flex flex-col items-center text-center space-y-8 px-4 py-20 mt-8">
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
          <div className="relative flex items-center bg-surface border border-border rounded-2xl overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all shadow-lg bg-card">
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
                <option value="en" className="bg-card text-foreground">🇺🇸 EN</option>
                <option value="id" className="bg-card text-foreground">🇮🇩 ID</option>
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
          <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 mt-4 shadow-lg flex flex-col gap-4 text-left animate-in slide-in-from-top-4 fade-in duration-500">
            <h3 className="font-heading font-bold text-lg mb-2">Processing Video...</h3>
            
            <div className={`flex items-center gap-4 transition-all duration-300 ${['extracting', 'transcribing', 'summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${['transcribing', 'summarizing', 'completed'].includes(status) ? 'bg-green-500/20 text-green-500' : status === 'extracting' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {['transcribing', 'summarizing', 'completed'].includes(status) ? '✓' : '🎵'}
              </div>
              <span className={`font-medium ${status === 'extracting' ? 'text-primary' : ''}`}>Extracting Audio</span>
            </div>

            <div className={`flex items-center gap-4 transition-all duration-300 ${['transcribing', 'summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${['summarizing', 'completed'].includes(status) ? 'bg-green-500/20 text-green-500' : status === 'transcribing' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {['summarizing', 'completed'].includes(status) ? '✓' : '📝'}
              </div>
              <span className={`font-medium ${status === 'transcribing' ? 'text-primary' : ''}`}>Transcribing Audio</span>
            </div>

            <div className={`flex items-center gap-4 transition-all duration-300 ${['summarizing', 'completed'].includes(status) ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${status === 'completed' ? 'bg-green-500/20 text-green-500' : status === 'summarizing' ? 'bg-primary/20 text-primary animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                {status === 'completed' ? '✓' : '🧠'}
              </div>
              <span className={`font-medium ${status === 'summarizing' ? 'text-primary' : ''}`}>Summarizing Content</span>
            </div>
          </div>
        )}
      </section>

      {/* Recent Summaries Section */}
      {recentSummaries.length > 0 && (
        <section className="w-full max-w-5xl px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold">Recent Summaries</h2>
            <Link href="/history" className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium transition-colors">
              View All History <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentSummaries.map((summary) => (
              <Link key={summary.id} href={`/summary/${summary.id}`}>
                <Card className="h-full bg-card hover:-translate-y-1 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 group overflow-hidden cursor-pointer flex flex-col">
                  <div className="h-40 bg-muted relative overflow-hidden flex items-center justify-center">
                    {summary.video?.thumbnail ? (
                      <Image 
                        src={summary.video.thumbnail} 
                        alt={summary.video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center text-5xl">
                        🐼
                      </div>
                    )}
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
            ))}
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full bg-card/50 py-24 px-4 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-heading text-3xl md:text-5xl font-bold">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get the essence of any long video in three simple steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2 shadow-[0_0_15px_rgba(209,77,40,0.3)]">
                <LinkIcon className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-xl">1. Paste the Link</h3>
              <p className="text-muted-foreground">Find a YouTube video you don't have time to watch and paste its URL.</p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center text-secondary mb-2 shadow-[0_0_15px_rgba(242,153,74,0.3)]">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-xl">2. AI Skims It</h3>
              <p className="text-muted-foreground">Our intelligent system extracts the audio, transcribes it, and analyzes the content.</p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-2 shadow-[0_0_15px_rgba(255,186,107,0.3)]">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="font-heading font-bold text-xl">3. Read Insights</h3>
              <p className="text-muted-foreground">Get a quick summary, key takeaways, and a structured breakdown instantly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full max-w-6xl mx-auto py-24 px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-heading text-3xl md:text-5xl font-bold">Why use SkimPanda?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to digest knowledge faster and reclaim your time.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <FastForward className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">Save Hours</h3>
              <p className="text-muted-foreground">Don't sit through a 2-hour podcast. Get the actionable insights in 2 minutes.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center text-secondary">
                <Globe className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">Multi-Language</h3>
              <p className="text-muted-foreground">Translate and summarize videos natively into English, Indonesian, and more.</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/40 border-border/50 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                <AlignLeft className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">Smart Formatting</h3>
              <p className="text-muted-foreground">Beautifully formatted takeaways and chronological section breakdowns.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-5xl mx-auto py-24 px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="font-heading text-3xl md:text-5xl font-bold">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your learning speed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="bg-card/40 border-border/50 relative overflow-hidden flex flex-col">
            <CardContent className="p-8 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="font-heading font-bold text-2xl">Basic</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  $0
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                </div>
                <p className="mt-4 text-muted-foreground">Perfect for casual learners.</p>
              </div>
              
              <ul className="mt-6 space-y-4 flex-1">
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span>3 video summaries per day</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span>Up to 20-minute video length</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-muted-foreground shrink-0" />
                  <span>Standard processing speed</span>
                </li>
              </ul>
              
              <Button variant="outline" className="w-full mt-8 rounded-xl py-6 font-bold border-border hover:bg-muted">
                Current Plan
              </Button>
            </CardContent>
          </Card>
          
          {/* Premium Plan */}
          <Card className="bg-card border-primary relative overflow-hidden flex flex-col shadow-[0_0_30px_rgba(209,77,40,0.15)] ring-1 ring-primary">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
            <div className="absolute top-4 right-4 bg-primary/20 text-primary text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
            <CardContent className="p-8 flex-1 flex flex-col">
              <div className="mb-4">
                <h3 className="font-heading font-bold text-2xl text-primary">Premium</h3>
                <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                  $5
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                </div>
                <p className="mt-4 text-muted-foreground">For power users and researchers.</p>
              </div>
              
              <ul className="mt-6 space-y-4 flex-1">
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Unlimited video summaries</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Support for 4+ hour videos</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Priority processing queue</span>
                </li>
                <li className="flex gap-3 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Export to Notion & PDF</span>
                </li>
              </ul>
              
              <Button className="w-full mt-8 rounded-xl py-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg">
                Upgrade to Premium
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-4 border-t border-border/40 mt-auto bg-card/20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🐼</div>
            <span className="font-heading font-bold text-xl text-foreground">SkimPanda</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} SkimPanda. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Signup Modal Overlay */}
      {showSignupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-primary/50 animate-in zoom-in-95 duration-200">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-4xl mb-2">
                🐼
              </div>
              <h3 className="font-heading font-bold text-2xl">Awesome! You've tried SkimPanda.</h3>
              <p className="text-muted-foreground">
                You've used your free guest summary. Create a free account to get 3 more today, save your history, and unlock more features!
              </p>
              <div className="flex flex-col gap-3 mt-6">
                <Link href="/register" className={cn(buttonVariants({ variant: "default" }), "w-full rounded-xl py-6 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg")}>
                  Sign Up for Free
                </Link>
                <Button variant="ghost" className="w-full" onClick={() => setShowSignupModal(false)}>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
