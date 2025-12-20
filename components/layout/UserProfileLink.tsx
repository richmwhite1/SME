"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfileLink() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const fetchUsername = async () => {
        try {
          const response = await fetch("/api/profile/username", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data?.username) {
              setUsername(data.username);
            }
          }
        } catch (err) {
          console.error("Error fetching username:", err);
        }
      };
      fetchUsername();
    }
  }, [isLoaded, user]);

  if (!isLoaded || !user) {
    return null;
  }

  const handleClick = () => {
    if (username) {
      router.push(`/u/${username}`);
    } else {
      router.push("/settings");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
    >
      My Profile
    </button>
  );
}



