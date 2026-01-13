import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCompareButton from "@/components/products/FloatingCompareButton";
import { ToastProvider } from "@/components/ui/ToastContainer";
import { SignalProvider } from "@/components/ui/SignalReceivedContainer";
import ReputationListener from "@/components/ui/ReputationListener";
import { ChatProvider } from "@/components/messages/ChatContext";
import GlobalChatDrawer from "@/components/messages/GlobalChatDrawer";

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
  metadataBase: new URL("https://sme-production.up.railway.app"),
  title: {
    template: "%s | The Health SME",
    default: "The Health SME - Evidence Meets Experience",
  },
  description: "Community-driven protocols for the gut, heart, and mind. Verify health products with scientific rigor and community experience.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sme-production.up.railway.app",
    siteName: "The Health SME",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${geistMono.variable} ${inter.className}`} suppressHydrationWarning>
      <body className="min-h-screen bg-forest-obsidian flex flex-col overflow-x-hidden">
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#D4AF37", // SME Gold
              colorBackground: "#0A0F0D", // forest-obsidian
              colorText: "#F5F1E8", // bone-white
              colorTextSecondary: "#F5F1E8CC", // bone-white with opacity
              colorInputBackground: "#0A0F0D",
              colorInputText: "#F5F1E8",
            },
            elements: {
              rootBox: "w-full",
              card: "bg-forest-obsidian border border-translucent-emerald",
              headerTitle: "text-bone-white",
              headerSubtitle: "text-bone-white/70",
              socialButtonsBlockButton: "bg-white/10 border-white/20 text-bone-white hover:bg-white/20",
              socialButtonsBlockButtonText: "text-bone-white font-medium",
              socialButtonsProviderIcon__google: "brightness-0 invert",
              formButtonPrimary: "bg-heart-green text-forest-black hover:bg-heart-green/90",
              footerActionLink: "text-heart-green hover:text-heart-green/80",
              identityPreviewText: "text-bone-white",
              identityPreviewEditButton: "text-heart-green",
              userButtonPopoverCard: "bg-forest-obsidian border border-translucent-emerald",
              userButtonPopoverActionButton: "text-bone-white hover:bg-white/10",
              userButtonPopoverActionButtonText: "text-bone-white",
              userButtonPopoverFooter: "hidden",
              userPreviewTextContainer: "text-bone-white",
              userPreviewMainIdentifier: "text-bone-white",
              userPreviewSecondaryIdentifier: "text-bone-white/70",
            },
          }}
          signInUrl="/"
          signUpUrl="/"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        >
          <ToastProvider>
            <ChatProvider>
              <SignalProvider>
                <ReputationListener />
                <Navbar />
                <main className="flex-1">
                  {children}
                </main>
                <FloatingCompareButton />
                <Footer />
                <GlobalChatDrawer />
              </SignalProvider>
            </ChatProvider>
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}


