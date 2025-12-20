"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { toggleFollow } from "@/app/actions/profile-actions";
import Button from "@/components/ui/Button";
import { UserPlus, UserMinus, Loader2, Brain } from "lucide-react";

interface ProfileFollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
}

export default function ProfileFollowButton({
  targetUserId,
  isFollowing: initialIsFollowing,
}: ProfileFollowButtonProps) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      return;
    }

    setLoading(true);
    try {
      await toggleFollow(targetUserId);
      setIsFollowing(!isFollowing);
      router.refresh();
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Optionally show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" className="flex items-center gap-2">
          <Brain size={16} />
          Sign in to Track Intelligence
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "primary"}
      onClick={handleToggleFollow}
      disabled={loading}
      className="flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {isFollowing ? "Untracking..." : "Tracking..."}
        </>
      ) : isFollowing ? (
        <>
          <UserMinus size={16} />
          Stop Tracking
        </>
      ) : (
        <>
          <Brain size={16} />
          Track Intelligence
        </>
      )}
    </Button>
  );
}





