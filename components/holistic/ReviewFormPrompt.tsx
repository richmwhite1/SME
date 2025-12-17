"use client";

import { SignInButton } from "@clerk/nextjs";
import Button from "@/components/ui/Button";

export default function ReviewFormPrompt() {
  return (
    <div className="mb-12 rounded-xl bg-white/50 p-8 text-center backdrop-blur-sm">
      <p className="mb-4 text-deep-stone/70">
        Sign in to join the discussion and share your experience
      </p>
      <SignInButton mode="modal">
        <Button variant="primary">Sign In to Review</Button>
      </SignInButton>
    </div>
  );
}

