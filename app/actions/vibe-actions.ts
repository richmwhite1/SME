"use server";

import { checkVibeForGuest } from "@/lib/vibe-check";

/**
 * Server action to check guest comment content
 * Returns { approved: boolean, reason?: string }
 */
export async function vibeCheck(content: string): Promise<{
  approved: boolean;
  reason?: string;
}> {
  const result = await checkVibeForGuest(content);
  return {
    approved: result.isSafe,
    reason: result.reason,
  };
}


