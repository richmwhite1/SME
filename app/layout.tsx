import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCompareButton from "@/components/products/FloatingCompareButton";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { SignalProvider } from "@/components/ui/SignalReceivedContainer";
import ReputationListener from "@/components/ui/ReputationListener";

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Using JetBrains Mono as Geist Mono alternative (Geist Mono is Vercel-proprietary)
// If Geist Mono is installed locally, it will be used via CSS fallback
const geistMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Holistic Community Protocol",
  description: "Community-driven protocols for the gut, heart, and mind",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${geistMono.variable} ${inter.className}`}>
      <body className="min-h-screen bg-forest-obsidian flex flex-col overflow-x-hidden">
        <ClerkProvider
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-forest-obsidian border border-translucent-emerald",
            },
          }}
          signInUrl="/"
          signUpUrl="/"
          afterSignInUrl="/"
          afterSignUpUrl="/"
        >
          <ToastProvider>
            <SignalProvider>
              <ReputationListener />
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <FloatingCompareButton />
              <Footer />
            </SignalProvider>
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}


