"use client";

import { SignInButton } from "@clerk/nextjs";
import Button from "@/components/ui/Button";

export default function ReviewFormPrompt() {
  return (
    <div className="mb-12 border border-translucent-emerald bg-muted-moss p-8 text-center">
      <p className="mb-4 text-bone-white font-mono">
        Sign in to join the discussion and share your experience
      </p>
      <SignInButton mode="modal">
        <Button variant="primary" className="border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider">
          Sign In to Review
        </Button>
      </SignInButton>
    </div>
  );
}

