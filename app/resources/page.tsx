"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/client";
import { Search, ExternalLink, BookOpen, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";
import TopicLeaderboard from "@/components/topics/TopicLeaderboard";

interface Resource {
  origin_type: "Product" | "Discussion";
  origin_id: string;
  origin_slug: string;
  title: string;
  reference_url: string;
  created_at: string;
  author_name: string | null;
  author_username: string | null;
  tags?: string[] | null; // Tags from origin item
}

export default function ResourcesPage() {
  const { user, isLoaded } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "Product" | "Discussion">("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrustedVoice, setIsTrustedVoice] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      const supabase = createClient();
      
      // Fetch resources from view
      const { data: resourcesData, error } = await supabase
        .from("resource_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
        setFilteredResources([]);
      } else {
        // Fetch tags for each resource from origin items
        const resourcesWithTags = await Promise.all(
          (resourcesData || []).map(async (resource: any) => {
            if (resource.origin_type === "Discussion") {
              const { data: discussion } = await supabase
                .from("discussions")
                .select("tags")
                .eq("id", resource.origin_id)
                .single();
              return { ...resource, tags: discussion?.tags || null };
            } else {
              const { data: product } = await supabase
                .from("protocols")
                .select("tags")
                .eq("id", resource.origin_id)
                .single();
              return { ...resource, tags: product?.tags || null };
            }
          })
        );

        setResources(resourcesWithTags as Resource[]);
        setFilteredResources(resourcesWithTags as Resource[]);
      }

      // Check if user is Trusted Voice
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("badge_type")
          .eq("id", user.id)
          .single();

        setIsTrustedVoice(profile?.badge_type === "Trusted Voice");
      }

      // Get topics that actually have resources from Trusted Voices
      // Fetch discussions with reference URLs and tags
      const { data: discussions } = await supabase
        .from("discussions")
        .select("tags, reference_url, author_id, profiles!discussions_author_id_fkey(badge_type)")
        .not("reference_url", "is", null)
        .not("tags", "is", null)
        .eq("is_flagged", false);

      // Fetch products with reference URLs and tags
      const { data: products } = await supabase
        .from("protocols")
        .select("tags, reference_url, created_by, profiles!protocols_created_by_fkey(badge_type)")
        .not("reference_url", "is", null)
        .not("tags", "is", null)
        .eq("is_flagged", false);

      const topicsWithResources = new Set<string>();
      
      // Only include topics from Trusted Voices
      (discussions || []).forEach((d: any) => {
        if (d.tags && d.profiles?.badge_type === "Trusted Voice") {
          d.tags.forEach((tag: string) => topicsWithResources.add(tag));
        }
      });
      
      (products || []).forEach((p: any) => {
        if (p.tags && p.profiles?.badge_type === "Trusted Voice") {
          p.tags.forEach((tag: string) => topicsWithResources.add(tag));
        }
      });

      // Fetch master topics and filter to only those with resources
      const { data: masterTopics } = await supabase
        .from("master_topics")
        .select("name")
        .order("display_order", { ascending: true });

      if (masterTopics) {
        const available = masterTopics
          .map((t: { name: string }) => t.name)
          .filter((name: string) => topicsWithResources.has(name));
        setAvailableTopics(available);
      }

      setLoading(false);
    }

    if (isLoaded) {
      fetchResources();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    let filtered = resources;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.title.toLowerCase().includes(query) ||
          resource.reference_url.toLowerCase().includes(query)
      );
    }

    // Apply origin type filter
    if (originFilter !== "all") {
      filtered = filtered.filter((resource) => resource.origin_type === originFilter);
    }

    // Apply topic filter
    if (topicFilter !== "all") {
      filtered = filtered.filter((resource) => {
        if (!resource.tags || resource.tags.length === 0) return false;
        return resource.tags.includes(topicFilter);
      });
    }

    setFilteredResources(filtered);
  }, [searchQuery, originFilter, topicFilter, resources]);

  return (
    <main className="min-h-screen bg-sand-beige px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-deep-stone md:text-5xl">
            Evidence Vault
          </h1>
          <p className="text-xl text-deep-stone/70">
            Curated research sources from Trusted Voices
          </p>
        </div>

        {/* Gatekeeper Message */}
        {isLoaded && !isTrustedVoice && (
          <div className="mb-6 rounded-lg border border-earth-green/30 bg-earth-green/10 p-4 text-center">
            <p className="text-sm text-deep-stone/80">
              The Evidence Vault only indexes sources from Trusted Voices. Contribute
              high-quality research to see your citations featured here.
            </p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-deep-stone/40" />
              <input
                type="text"
                placeholder="Search by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-soft-clay/30 bg-white/70 pl-10 pr-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none"
              />
            </div>
          </div>

          {/* Origin Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setOriginFilter("all")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                originFilter === "all"
                  ? "bg-earth-green text-sand-beige"
                  : "bg-white/50 text-deep-stone hover:bg-white/70"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setOriginFilter("Product")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                originFilter === "Product"
                  ? "bg-earth-green text-sand-beige"
                  : "bg-white/50 text-deep-stone hover:bg-white/70"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setOriginFilter("Discussion")}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                originFilter === "Discussion"
                  ? "bg-earth-green text-sand-beige"
                  : "bg-white/50 text-deep-stone hover:bg-white/70"
              }`}
            >
              Discussions
            </button>
          </div>

          {/* Topic Filter */}
          {availableTopics.length > 0 && (
            <div>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-sm text-deep-stone focus:border-earth-green focus:outline-none"
              >
                <option value="all">All Topics</option>
                {availableTopics.map((topic) => (
                  <option key={topic} value={topic}>
                    #{topic}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-deep-stone/60">
          {loading ? (
            "Loading..."
          ) : (
            <>
              {filteredResources.length} source{filteredResources.length !== 1 ? "s" : ""} found
            </>
          )}
        </div>

        {/* Resources List */}
        {loading ? (
          <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
            <p className="text-deep-stone/70">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="rounded-xl bg-white/50 p-12 text-center backdrop-blur-sm">
            <p className="text-deep-stone/70">
              {searchQuery || originFilter !== "all"
                ? "No resources match your filters."
                : "No resources available yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <div
                key={`${resource.origin_type}-${resource.origin_id}`}
                className="rounded-xl bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {resource.origin_type === "Product" ? (
                        <BookOpen className="h-4 w-4 text-earth-green" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-earth-green" />
                      )}
                      <span className="rounded-full bg-earth-green/20 px-2 py-0.5 text-xs font-medium text-earth-green">
                        {resource.origin_type}
                      </span>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-deep-stone">
                      {resource.title}
                    </h3>
                    <a
                      href={resource.reference_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-3 flex items-center gap-2 text-sm text-earth-green hover:underline"
                    >
                      <span className="truncate">{resource.reference_url}</span>
                      <ExternalLink size={14} />
                    </a>
                    <div className="flex items-center gap-4 text-xs text-deep-stone/60">
                      {resource.author_name && (
                        <span>
                          by {resource.author_name}
                          {resource.author_username && (
                            <span className="ml-1">@{resource.author_username}</span>
                          )}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(resource.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <Link
                        href={
                          resource.origin_type === "Product"
                            ? `/products/${resource.origin_slug}`
                            : `/discussions/${resource.origin_slug}`
                        }
                        className="text-earth-green hover:underline"
                      >
                        View {resource.origin_type === "Product" ? "Product" : "Discussion"}
                      </Link>
                    </div>
                    {resource.tags && resource.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resource.tags.map((tag) => (
                          <TopicBadge key={tag} topic={tag} clickable={true} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
          <aside className="lg:col-span-1">
            <TopicLeaderboard />
          </aside>
        </div>
      </div>
    </main>
  );
}

