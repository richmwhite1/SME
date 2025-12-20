"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UserProfileLink() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const fetchUsername = async () => {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        
        if (data?.username) {
          setUsername(data.username);
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



