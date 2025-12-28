"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile-actions";
import Button from "@/components/ui/Button";
import { Save, Loader2 } from "lucide-react";

interface ProfileSettingsFormProps {
  initialProfile: {
    full_name: string | null;
    username: string | null;
    bio: string | null;
    credentials: string | null;
    profession: string | null;
    website_url: string | null;
    social_links: {
      discord?: string | null;
      telegram?: string | null;
      x?: string | null;
      instagram?: string | null;
    } | null;
    allows_guest_messages?: boolean | null;
  };
}

export default function ProfileSettingsForm({ initialProfile }: ProfileSettingsFormProps) {
  const [fullName, setFullName] = useState(initialProfile.full_name || "");
  const [username, setUsername] = useState(initialProfile.username || "");
  const [bio, setBio] = useState(initialProfile.bio || "");
  const [credentials, setCredentials] = useState(initialProfile.credentials || "");
  const [profession, setProfession] = useState(initialProfile.profession || "");
  const [websiteUrl, setWebsiteUrl] = useState(initialProfile.website_url || "");
  const [discord, setDiscord] = useState(initialProfile.social_links?.discord || "");
  const [telegram, setTelegram] = useState(initialProfile.social_links?.telegram || "");
  const [x, setX] = useState(initialProfile.social_links?.x || "");
  const [instagram, setInstagram] = useState(initialProfile.social_links?.instagram || "");

  // Default to true if null/undefined
  const [allowsGuestMessages, setAllowsGuestMessages] = useState(initialProfile.allows_guest_messages ?? true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(
        fullName,
        username,
        bio,
        credentials,
        profession,
        websiteUrl,
        {
          discord: discord || undefined,
          telegram: telegram || undefined,
          x: x || undefined,
          instagram: instagram || undefined,
        },
        allowsGuestMessages
      );

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-deep-stone">Basic Information</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-deep-stone">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-deep-stone">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., dr-sarah-smith"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
            <p className="mt-1 text-xs text-deep-stone/60">
              3-20 characters, letters, numbers, dashes, and underscores only
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="mb-2 block text-sm font-medium text-deep-stone">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="credentials" className="mb-2 block text-sm font-medium text-deep-stone">
              Credentials
            </label>
            <input
              type="text"
              id="credentials"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
              placeholder="e.g., MD, PhD, Certified Nutritionist"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="profession" className="mb-2 block text-sm font-medium text-deep-stone">
              Profession
            </label>
            <input
              type="text"
              id="profession"
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              placeholder="e.g., Neuroscientist, Nutritionist, Researcher"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className="mb-2 block text-sm font-medium text-deep-stone">
              Website URL
            </label>
            <input
              type="url"
              id="websiteUrl"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-deep-stone">Social Media</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="discord" className="mb-2 block text-sm font-medium text-deep-stone">
              Discord
            </label>
            <input
              type="text"
              id="discord"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="https://discord.gg/invitecode or username#1234"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
            <p className="mt-1 text-xs text-deep-stone/60">
              Enter a Discord server invite link (https://discord.gg/...) for a clickable link, or your username for display
            </p>
          </div>

          <div>
            <label htmlFor="telegram" className="mb-2 block text-sm font-medium text-deep-stone">
              Telegram
            </label>
            <input
              type="text"
              id="telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="x" className="mb-2 block text-sm font-medium text-deep-stone">
              X (Twitter)
            </label>
            <input
              type="text"
              id="x"
              value={x}
              onChange={(e) => setX(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="instagram" className="mb-2 block text-sm font-medium text-deep-stone">
              Instagram
            </label>
            <input
              type="text"
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@username"
              className="w-full rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white/50 p-6 backdrop-blur-sm">
        <h2 className="mb-4 text-xl font-semibold text-deep-stone">Messaging Preferences</h2>
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="guestMessages" className="font-medium text-deep-stone">
              Allow Messages from Everyone
            </label>
            <p className="text-sm text-deep-stone/60">
              If disabled, only Verified SMEs, Connections, and High-Reputation users can message you.
            </p>
          </div>
          <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
            <input
              type="checkbox"
              name="guestMessages"
              id="guestMessages"
              checked={allowsGuestMessages}
              onChange={(e) => setAllowsGuestMessages(e.target.checked)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:right-0 right-6"
            />
            <label htmlFor="guestMessages" className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${allowsGuestMessages ? 'bg-earth-green' : 'bg-gray-300'}`}></label>
            {/* Using simple checkbox for now if no toggle component exists, or custom styling */}
            <input
              type="checkbox"
              id="guestMessages"
              checked={allowsGuestMessages}
              onChange={(e) => setAllowsGuestMessages(e.target.checked)}
              className="h-6 w-6 rounded border-gray-300 text-earth-green focus:ring-earth-green"
            />
          </div>
        </div>
      </div>

      {
        message && (
          <div
            className={`rounded-lg p-4 ${message.type === "success"
              ? "bg-earth-green/10 text-earth-green"
              : "bg-red-50 text-red-700"
              }`}
          >
            {message.text}
          </div>
        )
      }

      <Button type="submit" variant="primary" disabled={loading} className="flex items-center gap-2">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save size={16} />
            Save Changes
          </>
        )}
      </Button>
    </form >
  );
}





