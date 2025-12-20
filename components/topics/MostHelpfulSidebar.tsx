import Link from "next/link";
import AvatarLink from "@/components/profile/AvatarLink";
import TrustWeight from "@/components/ui/TrustWeight";

interface MostHelpfulSidebarProps {
  topicName: string;
}

interface Contributor {
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  reputation: number;
}

export default async function MostHelpfulSidebar({
  topicName,
}: MostHelpfulSidebarProps) {
  const supabase = createClient();

  // Fetch most helpful contributors for this topic
  const { data: contributors, error } = await supabase
    .from("most_helpful_contributors")
    .select("user_id, full_name, username, avatar_url, reputation")
    .eq("topic", topicName)
    .order("reputation", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching most helpful contributors:", error);
    return null;
  }

  const typedContributors = (contributors || []) as Contributor[];

  if (typedContributors.length === 0) {
    return null;
  }

  return (
    <div className="border border-translucent-emerald bg-forest-obsidian p-4">
      <h3 className="mb-4 font-serif text-lg font-semibold text-bone-white">
        Most Helpful
      </h3>
      <div className="space-y-3">
        {typedContributors.map((contributor) => (
          <Link
            key={contributor.user_id}
            href={contributor.username ? `/u/${contributor.username}` : `/profile/${contributor.user_id}`}
            className="flex items-center gap-3 rounded border border-translucent-emerald bg-muted-moss p-3 transition-colors hover:border-heart-green hover:bg-forest-obsidian"
          >
            <AvatarLink
              userId={contributor.user_id}
              username={contributor.username}
              avatarUrl={contributor.avatar_url}
              fullName={contributor.full_name}
              size={32}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-bone-white">
                  {contributor.full_name || "Anonymous"}
                </span>
                {contributor.username && (
                  <span className="text-xs text-bone-white/70 font-mono">
                    @{contributor.username}
                  </span>
                )}
              </div>
              <div className="mt-1">
                <TrustWeight
                  value={contributor.reputation}
                  topic={topicName}
                  className="text-xs"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}



