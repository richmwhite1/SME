"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useUser } from "@clerk/nextjs";
import { toggleFollow } from "@/app/actions/profile-actions";
import Button from "@/components/ui/Button";
import { UserPlus, UserCheck } from "lucide-react";

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
  const [isPending, setIsPending] = useState(false);

  const handleToggleFollow = async () => {
    if (!isSignedIn) {
      return;
    }

    const newStatus = !isFollowing;
    setIsFollowing(newStatus); // Optimistic update
    setIsPending(true);

    try {
      await toggleFollow(targetUserId);
      router.refresh();
    } catch (error) {
      console.error("Error toggling follow:", error);
      setIsFollowing(!newStatus); // Revert on error
    } finally {
      setIsPending(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button variant="outline" className="flex items-center gap-2">
          <UserPlus size={16} />
          Sign in to Follow
        </Button>
      </SignInButton>
    );
  }

  return (
    <Button
      variant={isFollowing ? "outline" : "primary"}
      onClick={handleToggleFollow}
      disabled={isPending}
      className={`
         flex items-center gap-2 transition-all min-w-[120px] justify-center
         ${isFollowing
          ? "bg-transparent border-translucent-emerald text-bone-white/60 hover:text-red-400 hover:border-red-400/50 hover:bg-transparent"
          : "bg-heart-green hover:bg-heart-green/90 text-forest-obsidian border-transparent"}
       `}
    >
      {isFollowing ? (
        <>
          <UserCheck size={16} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Follow
        </>
      )}
    </Button>
  );
}





