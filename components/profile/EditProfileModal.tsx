"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Twitter, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { updateProfile, updateSocialHandles } from "@/app/actions/profile-actions";
import Button from "@/components/ui/Button";

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  profession: string | null;
}

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
}

export default function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const router = useRouter();
  const { user } = useUser();
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [profession, setProfession] = useState(profile.profession || "");
  const [xHandle, setXHandle] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [bio, setBio] = useState(profile.bio || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize X and Telegram from Clerk publicMetadata
  useEffect(() => {
    if (user?.publicMetadata) {
      const metadata = user.publicMetadata as {
        xHandle?: string | null;
        telegramHandle?: string | null;
      };
      setXHandle(metadata.xHandle || "");
      setTelegramHandle(metadata.telegramHandle || "");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Dual-save handler: Database + Clerk
      
      // 1. Database Update: Save profession to Supabase
      await updateProfile(
        fullName.trim(),
        profile.username || "", // Keep existing username
        bio.trim(),
        "", // credentials (not in modal)
        profession.trim(), // profession
        "", // website_url (not in modal)
        {} // socialLinks (saved to Clerk, not DB)
      );

      // 2. Clerk Metadata Update: Save X and Telegram to Clerk publicMetadata
      await updateSocialHandles(
        xHandle.trim() || null,
        telegramHandle.trim() || null
      );

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-forest-obsidian/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md border border-translucent-emerald bg-muted-moss p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-4 flex items-center justify-between border-b border-translucent-emerald pb-3">
            <h2 className="font-serif text-lg font-semibold text-bone-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-bone-white/70 hover:text-bone-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="mb-1 block text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                Display Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="Your display name"
                maxLength={100}
              />
            </div>

            {/* Profession */}
            <div>
              <label className="mb-1 block text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                Profession
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="e.g., Neuroscientist, Nutritionist, Researcher"
                maxLength={100}
              />
            </div>

            {/* X Handle */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                <Twitter size={12} />
                X Handle
              </label>
              <input
                type="text"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="@username"
                maxLength={50}
              />
            </div>

            {/* Telegram Username */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                <MessageCircle size={12} />
                Telegram Username
              </label>
              <input
                type="text"
                value={telegramHandle}
                onChange={(e) => setTelegramHandle(e.target.value)}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono"
                placeholder="@username"
                maxLength={50}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1 block text-xs text-bone-white/70 font-mono uppercase tracking-wider">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full bg-forest-obsidian border border-translucent-emerald px-3 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none transition-all font-mono resize-none"
                placeholder="Tell us about yourself..."
                maxLength={500}
              />
            </div>

            {error && (
              <div className="rounded border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-400 font-mono">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-bone-white/70 hover:text-bone-white font-mono uppercase tracking-wider transition-colors"
              >
                Cancel
              </button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex items-center gap-2 text-xs font-mono"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}



