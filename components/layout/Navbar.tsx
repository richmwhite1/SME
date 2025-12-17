"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Library } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-soft-clay/20 bg-sand-beige/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-semibold text-earth-green transition-all duration-300 hover:scale-[1.02]"
        >
          SME
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/products"
            className="text-deep-stone transition-colors duration-300 hover:text-earth-green"
          >
            Products
          </Link>
          <Link
            href="/discussions"
            className="text-deep-stone transition-colors duration-300 hover:text-earth-green"
          >
            Community
          </Link>
          <Link
            href="/resources"
            className="flex items-center gap-1 text-deep-stone transition-colors duration-300 hover:text-earth-green"
          >
            <Library size={16} />
            Evidence Vault
          </Link>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="rounded-xl px-4 py-2 text-sm font-medium text-earth-green transition-all duration-300 hover:scale-[1.02] active:scale-95 hover:bg-earth-green/10">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}

