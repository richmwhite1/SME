"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, ExternalLink, BookOpen, MessageSquare, Paperclip, FlaskConical, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";
import Image from "next/image";
import { getResources, getUserBadge } from "@/app/actions/resource-actions";
import ResourceCard from "@/components/resources/ResourceCard";

interface Resource {
  origin_type: "Product" | "Discussion";
  origin_id: string;
  origin_slug: string;
  title: string;
  reference_url: string;
  created_at: string | null;
  author_name: string | null;
  author_username: string | null;
  tags?: string[] | null; // Tags from origin item
  images?: string[] | null; // Product images
  is_sme_certified?: boolean;
  third_party_lab_verified?: boolean;
  hasVerifiedCOA?: boolean; // Has verified evidence submission
  sourceType?: "Lab Report" | "Clinical Research" | "Product Audit" | "Field Notes" | null;
}

export default function ResourcesPage() {
  const { user, isLoaded } = useUser();
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [originFilter, setOriginFilter] = useState<"all" | "Product" | "Discussion">("all");
  const [archiveFilter, setArchiveFilter] = useState<"all" | "Lab Reports" | "Clinical Research" | "Product Audits" | "Field Notes">("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrustedVoice, setIsTrustedVoice] = useState(false);

  useEffect(() => {
    async function fetchResources() {
      try {
        const { success, data } = await getResources();

        if (success && data) {
          // Cast the data to Resource[]
          const typedResources = data as unknown as Resource[];
          setResources(typedResources);
          setFilteredResources(typedResources);

          // Extract unique topics
          const topics = new Set<string>();
          typedResources.forEach(r => {
            if (r.tags && Array.isArray(r.tags)) {
              r.tags.forEach(t => topics.add(t));
            }
          });
          setAvailableTopics(Array.from(topics).sort());
        }
      } catch (error) {
        console.error("Error fetching resources:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  useEffect(() => {
    async function checkUserBadge() {
      if (user) {
        const { success, badge_type } = await getUserBadge(user.id);
        if (success && badge_type === "Trusted Voice") {
          setIsTrustedVoice(true);
        }
      }
    }

    if (isLoaded && user) {
      checkUserBadge();
    }
  }, [user, isLoaded]);

  // Filter logic
  useEffect(() => {
    let result = resources;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(query) ||
        (r.author_name && r.author_name.toLowerCase().includes(query)) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(query)))
      );
    }

    // Origin filter
    if (originFilter !== "all") {
      result = result.filter(r => r.origin_type === originFilter);
    }

    // Archive filter
    if (archiveFilter !== "all") {
      result = result.filter(r => r.sourceType === archiveFilter);
    }

    // Topic filter
    if (topicFilter !== "all") {
      result = result.filter(r => r.tags && r.tags.includes(topicFilter));
    }

    setFilteredResources(result);
  }, [resources, searchQuery, originFilter, archiveFilter, topicFilter]);

  const getSourceIcon = (sourceType?: string | null) => {
    switch (sourceType) {
      case "Lab Report":
        return <FlaskConical className="h-3.5 w-3.5 text-sme-gold" />;
      case "Clinical Research":
        return <FileText className="h-3.5 w-3.5 text-heart-green" />;
      case "Product Audit":
        return <ClipboardList className="h-3.5 w-3.5 text-third-eye-indigo" />;
      case "Field Notes":
        return <MessageSquare className="h-3.5 w-3.5 text-bone-white" />;
      default:
        return <Paperclip className="h-3.5 w-3.5 text-bone-white/50" />;
    }
  };

  return (
    <main className="min-h-screen bg-forest-obsidian px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-bone-white">Resource Library</h1>
          <p className="text-xs text-bone-white/70 font-mono uppercase tracking-wider">
            Curated evidence, research, and product audits
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-white/50" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-translucent-emerald bg-muted-moss py-2 pl-10 pr-4 text-sm text-bone-white placeholder-bone-white/30 focus:border-heart-green focus:outline-none font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="border border-translucent-emerald bg-forest-obsidian px-3 py-1.5 text-xs text-bone-white focus:border-heart-green focus:outline-none font-mono uppercase"
            >
              <option value="all">All Topics</option>
              {availableTopics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <div className="flex border border-translucent-emerald bg-forest-obsidian">
              <button
                onClick={() => setOriginFilter("all")}
                className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors ${originFilter === "all" ? "bg-muted-moss text-bone-white" : "text-bone-white/70 hover:text-bone-white"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setOriginFilter("Product")}
                className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors ${originFilter === "Product" ? "bg-muted-moss text-bone-white" : "text-bone-white/70 hover:text-bone-white"
                  }`}
              >
                Products
              </button>
              <button
                onClick={() => setOriginFilter("Discussion")}
                className={`px-3 py-1.5 text-xs font-mono uppercase transition-colors ${originFilter === "Discussion" ? "bg-muted-moss text-bone-white" : "text-bone-white/70 hover:text-bone-white"
                  }`}
              >
                Discussions
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {loading ? (
              <div className="py-12 text-center text-bone-white/50 font-mono">
                Loading resources...
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="border border-translucent-emerald bg-muted-moss p-12 text-center text-bone-white/70 font-mono">
                No resources found matching your criteria.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredResources.map((resource) => {
                  const isVerified = resource.is_sme_certified || resource.third_party_lab_verified || resource.hasVerifiedCOA;
                  const formattedDate = resource.created_at ? formatDistanceToNow(new Date(resource.created_at), { addSuffix: true }) : null;

                  return (
                    <ResourceCard
                      key={`${resource.origin_type}-${resource.origin_id}`}
                      resource={resource}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            {/* Archive Filter Sidebar */}
            <div className="border border-translucent-emerald bg-muted-moss p-4 sticky top-6">
              <h2 className="mb-4 font-serif text-lg font-semibold text-bone-white">Archive Filter</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setArchiveFilter("all")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase active:scale-95 ${archiveFilter === "all"
                    ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                    : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                    }`}
                >
                  All Sources
                </button>
                <button
                  onClick={() => setArchiveFilter("Lab Reports")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${archiveFilter === "Lab Reports"
                    ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                    : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                    }`}
                >
                  <FlaskConical size={12} />
                  Lab Reports
                </button>
                <button
                  onClick={() => setArchiveFilter("Clinical Research")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${archiveFilter === "Clinical Research"
                    ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                    : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                    }`}
                >
                  <FileText size={12} />
                  Clinical Research
                </button>
                <button
                  onClick={() => setArchiveFilter("Product Audits")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${archiveFilter === "Product Audits"
                    ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                    : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                    }`}
                >
                  <ClipboardList size={12} />
                  Product Audits
                </button>
                <button
                  onClick={() => setArchiveFilter("Field Notes")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${archiveFilter === "Field Notes"
                    ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                    : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                    }`}
                >
                  <MessageSquare size={12} />
                  Field Notes
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
