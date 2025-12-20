"use client";

import { useState } from "react";
import { Edit, X } from "lucide-react";
import Button from "@/components/ui/Button";
import EditProfileModal from "./EditProfileModal";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  profession: string | null;
}

interface EditProfileButtonProps {
  profile: Profile;
}

export default function EditProfileButton({ profile }: EditProfileButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 border border-translucent-emerald bg-forest-obsidian px-3 py-1.5 text-xs text-bone-white hover:bg-muted-moss transition-colors font-mono uppercase tracking-wider"
      >
        <Edit size={12} />
        Edit Profile
      </button>
      
      {isOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}



