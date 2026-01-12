"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Library, Menu, X, Plus, ChevronDown, Info } from "lucide-react";
import AdminNavLink from "./AdminNavLink";
import SearchBar from "@/components/search/SearchBar";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import FeedNotificationDot from "./FeedNotificationDot";
import SMEUserButton from "./SMEUserButton";
import PrefetchLink from "./PrefetchLink";
import SMEDashboardLink from "./SMEDashboardLink";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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
            The Health SME
          </span>
          <span className="text-[10px] text-sme-gold/80 font-mono tracking-widest uppercase -mt-1">
            where evidence meets experience
          </span>
        </Link>

        {/* Search Bar - Centered, Command-Line Style - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8 relative">
          <div
            className={`w-full transition-all duration-300 ease-out ${isSearchExpanded
              ? "fixed left-1/2 top-3 -translate-x-1/2 w-[90vw] max-w-4xl z-[100]"
              : "relative"
              }`}
          >
            <SearchBar
              onExpand={() => setIsSearchExpanded(true)}
              onCollapse={() => setIsSearchExpanded(false)}
            />
          </div>
          {/* Fixed Backdrop */}
          <div
            className={`fixed inset-0 bg-forest-obsidian/80 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isSearchExpanded ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
            aria-hidden="true"
          />
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
          <PrefetchLink
            href="/how-it-works"
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 ${getLinkStyles('/how-it-works')}`}
          >
            How it Works
          </PrefetchLink>

          {/* Submit Dropdown */}
          <div className="relative group">
            <button className="min-h-[44px] px-4 flex items-center gap-1.5 text-bone-white/70 hover:text-bone-white transition-colors font-mono text-xs uppercase tracking-wider active:scale-95 border border-translucent-emerald hover:border-sme-gold">
              <Plus size={14} />
              <span>Submit</span>
              <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute right-0 mt-1 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-muted-moss border border-translucent-emerald shadow-lg">
                <Link
                  href="/products/submit"
                  className="block px-4 py-3 text-sm font-mono text-bone-white/70 hover:text-bone-white hover:bg-forest-obsidian transition-colors border-b border-translucent-emerald/30"
                >
                  + Add Product
                </Link>
                <Link
                  href="/discussions/new"
                  className="block px-4 py-3 text-sm font-mono text-bone-white/70 hover:text-bone-white hover:bg-forest-obsidian transition-colors"
                >
                  + Start Discussion
                </Link>
              </div>
            </div>
          </div>

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

            {/* Submit Section */}
            <div className="pt-3 pb-2 border-t border-translucent-emerald/30">
              <div className="text-xs text-bone-white/50 font-mono uppercase tracking-wider mb-2">Submit</div>
              <Link
                href="/products/submit"
                onClick={() => setMobileMenuOpen(false)}
                className="block transition-colors font-mono text-xs uppercase tracking-wider py-2 text-bone-white/70 hover:text-bone-white active:scale-95 pl-2"
              >
                + Add Product
              </Link>
              <Link
                href="/discussions/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block transition-colors font-mono text-xs uppercase tracking-wider py-2 text-bone-white/70 hover:text-bone-white active:scale-95 pl-2"
              >
                + Start Discussion
              </Link>
            </div>

            <PrefetchLink
              href="/community"
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/community')}`}
            >
              Community
            </PrefetchLink>
            <PrefetchLink
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className={`block transition-colors font-mono text-xs uppercase tracking-wider py-2 active:scale-95 ${getLinkStyles('/how-it-works')}`}
            >
              How it Works
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

