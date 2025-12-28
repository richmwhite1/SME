"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Library, Menu, X } from "lucide-react";
import AdminNavLink from "./AdminNavLink";
import SearchBar from "@/components/search/SearchBar";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import FeedNotificationDot from "./FeedNotificationDot";
import SMEUserButton from "./SMEUserButton";
import PrefetchLink from "./PrefetchLink";
import SMEDashboardLink from "./SMEDashboardLink";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const getLinkStyles = (path: string) =>
    isLinkActive(path)
      ? "text-bone-white font-bold"
      : "text-bone-white/70 hover:text-bone-white";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-translucent-emerald bg-muted-moss/80 backdrop-blur-md overflow-x-hidden">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex flex-col flex-shrink-0 hover:text-sme-gold transition-colors"
        >
          <span className="font-serif text-2xl font-bold text-bone-white">
            Health SME
          </span>
          <span className="text-[10px] text-sme-gold/80 font-mono tracking-widest uppercase -mt-1">
            where evidence meets experience
          </span>
        </Link>

        {/* Search Bar - Centered, Command-Line Style - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8">
          <SearchBar />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-5 flex-shrink-0 text-sm">
          <PrefetchLink
            href="/products"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 ${getLinkStyles('/products')}`}
          >
            Products
          </PrefetchLink>
          <PrefetchLink
            href="/discussions"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 ${getLinkStyles('/discussions')}`}
          >
            Discussions
          </PrefetchLink>
          <PrefetchLink
            href="/feed"
            className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 ${getLinkStyles('/feed')}`}
          >
            My Feed
            <FeedNotificationDot />
          </PrefetchLink>
          <PrefetchLink
            href="/resources"
            className={`flex items-center gap-1.5 min-h-[44px] min-w-[44px] justify-center transition-colors font-mono text-xs uppercase tracking-wider relative active:scale-95 ${getLinkStyles('/resources')}`}
          >
            <Library size={12} />
            <span>SME Citations</span>
          </PrefetchLink>
          <PrefetchLink
            href="/community"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 ${getLinkStyles('/community')}`}
          >
            Community
          </PrefetchLink>

          <SMEDashboardLink />
          <AdminNavLink />

          <SignedIn>
            <NotificationCenter />
            <SMEUserButton />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="min-h-[44px] min-w-[44px] px-3 py-1.5 text-xs text-bone-white hover:text-bone-white border border-translucent-emerald transition-all duration-200 hover:bg-forest-obsidian font-mono uppercase active:scale-95">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex items-center justify-center w-10 h-10 text-bone-white hover:text-heart-green transition-colors active:scale-95"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu - Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-translucent-emerald bg-muted-moss">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {/* Mobile Search */}
            <div className="mb-4">
              <SearchBar />
            </div>

            {/* Mobile Navigation Links */}
            <PrefetchLink
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/products')}`}
            >
              Products
            </PrefetchLink>
            <PrefetchLink
              href="/discussions"
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/discussions')}`}
            >
              Discussions
            </PrefetchLink>
            <PrefetchLink
              href="/feed"
              onClick={() => setMobileMenuOpen(false)}
              className={`relative block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/feed')}`}
            >
              My Feed
              <FeedNotificationDot />
            </PrefetchLink>
            <PrefetchLink
              href="/resources"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-1.5 transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/resources')}`}
            >
              <Library size={12} />
              <span>SME Citations</span>
            </PrefetchLink>
            <PrefetchLink
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/community')}`}
            >
              Community
            </PrefetchLink>

            <div className="pt-2 border-t border-translucent-emerald">
              <SMEDashboardLink />
              <AdminNavLink />
              <SignedIn>
                <div className="mt-2 flex items-center gap-2">
                  <NotificationCenter />
                  <SMEUserButton />
                </div>
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="mt-2 w-full px-3 py-1.5 text-xs text-bone-white hover:text-bone-white border border-translucent-emerald transition-colors hover:bg-forest-obsidian font-mono uppercase active:scale-95"
                  >
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

