import { getDb } from "@/lib/db";
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

interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  contributor_score: number | null;
}

// Calculate primary niche for a user based on their contributions
async function getPrimaryNiche(userId: string): Promise<string | null> {
  const sql = getDb();
  
  try {
    // Get all master topics
    const masterTopics = await sql<{ name: string }[]>`
      SELECT name FROM master_topics ORDER BY display_order ASC
    `;
    
    if (!masterTopics || masterTopics.length === 0) {
      return null;
    }
    
    const masterTopicNames = masterTopics.map((t) => t.name);
    const topicCounts = new Map<string, number>();
    
    // Initialize counts
    masterTopicNames.forEach((topic) => {
      topicCounts.set(topic, 0);
    });
    
    // Count topics from discussions (reviews don't have tags)
    const discussions = await sql<{ tags: string[] | null }[]>`
      SELECT tags FROM discussions WHERE author_id = ${userId} AND tags IS NOT NULL
    `;
  
    discussions.forEach((discussion) => {
      if (discussion.tags && Array.isArray(discussion.tags)) {
        discussion.tags.forEach((tag) => {
          if (masterTopicNames.includes(tag)) {
            topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
          }
        });
      }
    });
    
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
  } catch (error) {
    console.error("Error calculating primary niche:", error);
    return null;
  }
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const sql = getDb();
  const params = await searchParams;
  const topicFilter = params.topic;
  
  // Fetch master topics for filter dropdown
  const masterTopics = await sql<MasterTopic[]>`
    SELECT name, display_order FROM master_topics ORDER BY display_order ASC
  `;
  
  // Fetch all users with contributor scores, ordered by score descending
  let profiles: Profile[] = [];
  try {
    profiles = await sql<Profile[]>`
      SELECT id, full_name, username, avatar_url, contributor_score
      FROM profiles
      WHERE contributor_score IS NOT NULL AND contributor_score > 0
      ORDER BY contributor_score DESC
      LIMIT 100
    `;
  } catch (error) {
    console.error("Error fetching profiles:", error);
  }
  
  // Calculate primary niche for each user
  const usersWithNiche: LeaderboardUser[] = [];
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




