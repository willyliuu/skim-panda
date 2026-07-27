import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { History, PlaySquare } from "lucide-react";
import { Providers } from "@/components/providers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { LogoutButton } from "@/components/logout-button";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkimPanda",
  description: "Skim smarter. Watch less. Know more.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} dark antialiased`}
    >
      <body className="min-h-screen flex flex-col font-sans relative">
        {/* Premium Ambient Background Elements */}
        <div className="pointer-events-none fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[100px] mix-blend-screen z-[-10]" />
        <div className="pointer-events-none fixed bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-secondary/10 blur-[100px] mix-blend-screen z-[-10]" />
        
        {/* Subtle Tech Dot Grid */}
        <div 
          className="pointer-events-none fixed inset-0 opacity-[0.07] z-[-10]" 
          style={{ backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)', backgroundSize: '32px 32px' }} 
        />
        
        <Providers>
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary-light transition-colors">
                <PlaySquare className="h-6 w-6" />
                <span className="font-heading font-bold text-xl text-foreground">SkimPanda</span>
              </Link>
              <nav className="flex items-center gap-6">
                <a href="/#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
                  Features
                </a>
                <a href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
                  Pricing
                </a>
                
                {session ? (
                  <>
                    <Link href="/history" className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                      <History className="h-4 w-4" />
                      History
                    </Link>
                    <div className="w-px h-4 bg-border"></div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-muted-foreground hidden sm:block">
                        {session.user?.name || session.user?.email}
                      </span>
                      <LogoutButton />
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Log in
                    </Link>
                    <Link href="/register" className="text-sm font-bold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors">
                      Sign up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
