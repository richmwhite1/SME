import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import TopicFilterDropdown from "@/components/leaderboard/TopicFilterDropdown";
import AvatarLink from "@/components/profile/AvatarLink";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface LeaderboardUser {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  contributor_score: number;
  primary_niche: string | null;
}

interface MasterTopic {
  name: string;
  display_order: number;
}

// Calculate primary niche for a user based on their contributions
async function getPrimaryNiche(userId: string): Promise<string | null> {
  const supabase = createClient();
  
  // Get all master topics
  const { data: masterTopics } = await supabase
    .from("master_topics")
    .select("name")
    .order("display_order", { ascending: true });
  
  if (!masterTopics || masterTopics.length === 0) {
    return null;
  }
  
  const masterTopicNames = masterTopics.map((t: { name: string }) => t.name);
  const topicCounts = new Map<string, number>();
  
  // Initialize counts
  masterTopicNames.forEach((topic: string) => {
    topicCounts.set(topic, 0);
  });
  
  // Count topics from discussions (reviews don't have tags)
  const { data: discussions } = await supabase
    .from("discussions")
    .select("tags")
    .eq("author_id", userId)
    .not("tags", "is", null);
  
  if (discussions) {
    discussions.forEach((discussion: any) => {
      if (discussion.tags && Array.isArray(discussion.tags)) {
        discussion.tags.forEach((tag: string) => {
          if (masterTopicNames.includes(tag)) {
            topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
          }
        });
      }
    });
  }
  
  // Find the topic with the highest count
  let maxCount = 0;
  let primaryNiche: string | null = null;
  
  topicCounts.forEach((count, topic) => {
    if (count > maxCount) {
      maxCount = count;
      primaryNiche = topic;
    }
  });
  
  return primaryNiche;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const supabase = createClient();
  const params = await searchParams;
  const topicFilter = params.topic;
  
  // Fetch master topics for filter dropdown
  const { data: masterTopics } = await supabase
    .from("master_topics")
    .select("name, display_order")
    .order("display_order", { ascending: true });
  
  // Fetch all users with contributor scores, ordered by score descending
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, contributor_score")
    .not("contributor_score", "is", null)
    .gt("contributor_score", 0)
    .order("contributor_score", { ascending: false })
    .limit(100);
  
  if (error) {
    console.error("Error fetching profiles:", error);
  }
  
  // Calculate primary niche for each user
  const usersWithNiche: LeaderboardUser[] = [];
  if (profiles) {
    for (const profile of profiles) {
      const primaryNiche = await getPrimaryNiche(profile.id);
      
      // Apply topic filter if specified
      if (topicFilter && primaryNiche !== topicFilter) {
        continue;
      }
      
      usersWithNiche.push({
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        contributor_score: profile.contributor_score || 0,
        primary_niche: primaryNiche,
      });
    }
  }
  
  return (
    <main className="min-h-screen bg-forest-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">
            Trusted Voice Leaderboard
          </h1>
          <p className="text-sm text-bone-white/70 font-mono uppercase tracking-wider">
            Top Research Contributors by Signal Score
          </p>
        </div>
        
        {/* Topic Filter Dropdown */}
        {masterTopics && masterTopics.length > 0 && (
          <Suspense fallback={<div className="mb-6 h-10 w-64 border border-translucent-emerald bg-muted-moss" />}>
            <TopicFilterDropdown
              masterTopics={masterTopics}
              currentTopic={topicFilter}
            />
          </Suspense>
        )}
        
        {/* Leaderboard Table - Apothecary Terminal */}
        {usersWithNiche.length === 0 ? (
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <p className="text-bone-white/70 font-mono">
              {topicFilter 
                ? `No contributors found for ${topicFilter}.` 
                : "No contributors yet."}
            </p>
          </div>
        ) : (
          <div className="border border-translucent-emerald bg-muted-moss overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-translucent-emerald bg-forest-obsidian">
                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold uppercase tracking-wider text-bone-white/70">
                      Rank
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold uppercase tracking-wider text-bone-white/70">
                      Expert
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-mono font-semibold uppercase tracking-wider text-bone-white/70">
                      Primary Niche
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-mono font-semibold uppercase tracking-wider text-bone-white/70">
                      Signal Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-translucent-emerald">
                  {usersWithNiche.map((user, index) => {
                    const rank = index + 1;
                    const isTrustedVoice = user.contributor_score > 100;
                    
                    return (
                      <tr
                        key={user.id}
                        className="bg-muted-moss transition-colors hover:bg-forest-obsidian"
                      >
                        {/* Rank */}
                        <td className="px-6 py-4 font-mono text-sm text-bone-white">
                          {rank}
                        </td>
                        
                        {/* Expert */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <AvatarLink
                              userId={user.id}
                              username={user.username}
                              avatarUrl={user.avatar_url}
                              fullName={user.full_name}
                              size={40}
                              className="border border-translucent-emerald rounded-full"
                            />
                            
                            {/* Name and Badge */}
                            <div className="flex items-center gap-2">
                              <Link
                                href={user.username ? `/u/${user.username}` : `/profile/${user.id}`}
                                className="font-medium text-bone-white hover:text-heart-green hover:underline"
                              >
                                {user.full_name || "Anonymous User"}
                              </Link>
                              {isTrustedVoice && (
                                <span className="inline-flex items-center gap-1 border border-sme-gold/30 bg-sme-gold/10 px-2 py-0.5 text-xs font-medium text-sme-gold font-mono uppercase">
                                  <ShieldCheck size={12} />
                                  Trusted Voice
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Primary Niche */}
                        <td className="px-6 py-4 text-sm text-bone-white/80 font-mono">
                          {user.primary_niche || (
                            <span className="text-bone-white/50 italic">Not specified</span>
                          )}
                        </td>
                        
                        {/* Signal Score */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-mono font-bold text-sme-gold">
                            {user.contributor_score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}




