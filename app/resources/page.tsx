"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Search, ExternalLink, BookOpen, MessageSquare, Paperclip, FlaskConical, FileText, ClipboardList } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import TopicBadge from "@/components/topics/TopicBadge";
import Image from "next/image";
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
interface DiscussionTags {
  tags: string[] | null;
}
interface ProductVerification {
  tags: string[] | null;
  images: string[] | null;
  is_sme_certified: boolean | null;
  third_party_lab_verified: boolean | null;
}
interface UserProfile {
  badge_type: string | null;
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
      
      // Fetch resources from view
      const { data: resourcesData, error } = await supabase
        .from("resource_library")
        .select("*");
      
      // Sort manually to handle null created_at values
      const sortedResources = (resourcesData || []).sort((a: any, b: any) => {
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate; // Descending order
      });
      if (error) {
        console.error("Error fetching resources:", error);
        setResources([]);
        setFilteredResources([]);
      } else {
        // Fetch verified evidence submissions for products
        const { data: verifiedEvidence } = await supabase
          .from("evidence_submissions")
          .select("product_id")
          .eq("status", "verified");
        
        const verifiedProductIds = new Set((verifiedEvidence || []).map((e: any) => e.product_id));
        // Fetch tags and product data for each resource from origin items
        const resourcesWithTags = await Promise.all(
          (sortedResources || []).map(async (resource: any) => {
            if (resource.origin_type === "Discussion") {
              const { data: discussion } = await supabase
                .from("discussions")
                .select("tags")
                .eq("id", resource.origin_id)
                .single() as { data: DiscussionTags | null };
              return { 
                ...resource, 
                tags: discussion?.tags || null,
                sourceType: "Field Notes" as const
              };
            } else {
              // Only include products with COA, Lab Report, or SME Verification
              const { data: product } = await supabase
                .from("protocols")
                .select("tags, images, is_sme_certified, third_party_lab_verified")
                .eq("id", resource.origin_id)
                .single() as { data: ProductVerification | null };
              
              // Check if product has verification
              const hasVerification = 
                product?.is_sme_certified || 
                product?.third_party_lab_verified || 
                verifiedProductIds.has(resource.origin_id);
              
              // Only include if verified
              if (!hasVerification) {
                return null;
              }
              // Determine source type based on verification
              let sourceType: "Lab Reports" | "Clinical Research" | "Product Audit" | "Field Notes" | null = null;
              if (product?.third_party_lab_verified || verifiedProductIds.has(resource.origin_id)) {
                sourceType = "Lab Reports";
              } else if (product?.is_sme_certified) {
                sourceType = "Product Audit";
              } else {
                sourceType = "Clinical Research";
              }
              return { 
                ...resource, 
                tags: product?.tags || null,
                images: product?.images || null,
                is_sme_certified: product?.is_sme_certified || false,
                third_party_lab_verified: product?.third_party_lab_verified || false,
                hasVerifiedCOA: verifiedProductIds.has(resource.origin_id),
                sourceType
              };
            }
          })
        );
        // Filter out null entries (unverified products)
        const validResources = resourcesWithTags.filter((r): r is Resource => r !== null);
        setResources(validResources as Resource[]);
        setFilteredResources(validResources as Resource[]);
      }
      // Check if user is Trusted Voice
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("badge_type")
          .eq("id", user.id)
          .single() as { data: UserProfile | null };
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
    // Apply archive filter
    if (archiveFilter !== "all") {
      filtered = filtered.filter((resource) => resource.sourceType === archiveFilter);
    }
    // Apply topic filter
    if (topicFilter !== "all") {
      filtered = filtered.filter((resource) => {
        if (!resource.tags || resource.tags.length === 0) return false;
        return resource.tags.includes(topicFilter);
      });
    }
    setFilteredResources(filtered);
  }, [searchQuery, originFilter, archiveFilter, topicFilter, resources]);
  return (
    <main className="min-h-screen bg-forest-obsidian">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
        {/* Header - SME Citations Archive */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-bone-white">
              SME Citations
            </h1>
          </div>
          <p className="text-sm text-bone-white font-mono uppercase tracking-wider">
            A permanent record of community-verified research and laboratory audits.
          </p>
        </div>
        {/* Gatekeeper Message */}
        {isLoaded && !isTrustedVoice && (
          <div className="mb-6 border border-translucent-emerald bg-muted-moss p-4">
            <p className="text-xs text-bone-white font-mono">
              SME Citations only indexes sources from Trusted Voices. Contribute
              high-quality research to see your citations featured here.
            </p>
          </div>
        )}
        {/* Search and Filter - Apothecary Terminal */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-white/50" />
              <input
                type="text"
                placeholder="Search by title or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-translucent-emerald bg-muted-moss pl-9 pr-4 py-2 text-sm text-bone-white placeholder-bone-white/50 focus:border-heart-green focus:outline-none font-mono"
              />
            </div>
          </div>
          {/* Origin Type Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setOriginFilter("all")}
              className={`border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase ${
                originFilter === "all"
                  ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                  : "border-translucent-emerald bg-muted-moss text-bone-white/70 hover:bg-forest-obsidian hover:border-heart-green"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setOriginFilter("Product")}
              className={`border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase ${
                originFilter === "Product"
                  ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                  : "border-translucent-emerald bg-muted-moss text-bone-white/70 hover:bg-forest-obsidian hover:border-heart-green"
              }`}
            >
              Products
            </button>
            <button
              onClick={() => setOriginFilter("Discussion")}
              className={`border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase ${
                originFilter === "Discussion"
                  ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                  : "border-translucent-emerald bg-muted-moss text-bone-white/70 hover:bg-forest-obsidian hover:border-heart-green"
              }`}
            >
              Discussions
            </button>
          </div>
        </div>
        {/* Results Count - Technical */}
        <div className="mb-6 text-xs text-bone-white/70 font-mono uppercase tracking-wider">
          {loading ? (
            "Loading..."
          ) : (
            <>
              {filteredResources.length} source{filteredResources.length !== 1 ? "s" : ""} found
            </>
          )}
        </div>
        {/* Resources List - Apothecary Terminal Cards */}
        {loading ? (
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <p className="text-bone-white/70 text-sm font-mono">Loading resources...</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="border border-translucent-emerald bg-muted-moss p-12 text-center">
            <p className="text-bone-white/70 text-sm font-mono">
              {searchQuery || originFilter !== "all"
                ? "No resources match your filters."
                : "No resources available yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResources.map((resource) => {
              // Determine if verified (has SME certification, lab verification, or COA)
              const isVerified = resource.is_sme_certified || resource.third_party_lab_verified || resource.hasVerifiedCOA;
              
              // Determine source type icon
              const getSourceIcon = () => {
                if (resource.reference_url?.toLowerCase().includes('.pdf')) {
                  return <Paperclip className="h-3.5 w-3.5 text-bone-white" />;
                }
                if (resource.sourceType === "Lab Report") {
                  return <FlaskConical className="h-3.5 w-3.5 text-bone-white" />;
                }
                if (resource.sourceType === "Clinical Research") {
                  return <FileText className="h-3.5 w-3.5 text-bone-white" />;
                }
                if (resource.sourceType === "Product Audit") {
                  return <ClipboardList className="h-3.5 w-3.5 text-bone-white" />;
                }
                return <Paperclip className="h-3.5 w-3.5 text-bone-white" />;
              };
              // Parse product images
              let imageUrl: string | null = null;
              if (resource.images) {
                if (Array.isArray(resource.images)) {
                  imageUrl = resource.images.find((img: any) => typeof img === 'string' && img.length > 0) || null;
                } else if (typeof resource.images === 'string') {
                  try {
                    const parsed = JSON.parse(resource.images);
                    if (Array.isArray(parsed)) {
                      imageUrl = parsed.find((img: any) => typeof img === 'string' && img.length > 0) || null;
                    } else {
                      const arrayMatch = (resource.images as string).match(/^\{([^}]*)\}$/);
                      if (arrayMatch) {
                        const urls = arrayMatch[1].split(',').map((s: string) => s.trim().replace(/^"|"$/g, ''));
                        imageUrl = urls.find((url: string) => url.length > 0) || null;
                      }
                    }
                  } catch (e) {
                    const arrayMatch = (resource.images as string).match(/^\{([^}]*)\}$/);
                    if (arrayMatch) {
                      const urls = arrayMatch[1].split(',').map((s: string) => s.trim().replace(/^"|"$/g, ''));
                      imageUrl = urls.find((url: string) => url.length > 0) || null;
                    }
                  }
                }
              }
              // Format date with Geist Mono
              const formattedDate = resource.created_at
                ? format(new Date(resource.created_at), "MMM d, yyyy")
                : null;
              return (
                <div
                  key={`${resource.origin_type}-${resource.origin_id}`}
                  className={`border bg-muted-moss p-5 transition-all duration-300 cursor-pointer select-none active:scale-[0.98] hover:opacity-90 hover:border-heart-green ${
                    isVerified ? "border-sme-gold" : "border-translucent-emerald"
                  }`}
                  style={{ userSelect: 'none' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Product Image (if Product type) */}
                    {resource.origin_type === "Product" && (
                      <div className="relative h-24 w-24 flex-shrink-0 border border-translucent-emerald bg-forest-obsidian overflow-hidden">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={resource.title}
                            fill
                            className="object-contain"
                            unoptimized={imageUrl.includes('supabase.co') || imageUrl.includes('unsplash.com')}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 border-2 border-white/20">
                            <span className="text-[8px] text-bone-white font-mono text-center px-1" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                              Specimen Under Audit
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {getSourceIcon()}
                        {resource.origin_type === "Product" ? (
                          <BookOpen className="h-3.5 w-3.5 text-heart-green" />
                        ) : (
                          <MessageSquare className="h-3.5 w-3.5 text-third-eye-indigo" />
                        )}
                        <span className="border border-translucent-emerald bg-forest-obsidian px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-bone-white">
                          {resource.origin_type}
                        </span>
                        {resource.sourceType && (
                          <span className="border border-translucent-emerald bg-forest-obsidian px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-bone-white">
                            {resource.sourceType}
                          </span>
                        )}
                        {isVerified && (
                          <span className="border border-sme-gold bg-sme-gold/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-sme-gold">
                            Verified
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 font-serif text-lg font-semibold text-bone-white">
                        {resource.title}
                      </h3>
                      <a
                        href={resource.reference_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-3 flex items-center gap-2 text-xs text-bone-white hover:text-heart-green font-mono"
                      >
                        <span className="truncate">{resource.reference_url}</span>
                        <ExternalLink size={12} />
                      </a>
                      <div className="flex items-center gap-4 text-[10px] text-bone-white font-mono">
                        {resource.author_name && (
                          <span>
                            by {resource.author_name}
                            {resource.author_username && (
                              <span className="ml-1">@{resource.author_username}</span>
                            )}
                          </span>
                        )}
                        {formattedDate ? (
                          <span className="font-mono" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                            {formattedDate}
                          </span>
                        ) : (
                          <span className="font-mono text-bone-white/50" style={{ fontFamily: 'var(--font-geist-mono), monospace' }}>
                            {resource.created_at ? format(new Date(resource.created_at), "MMM d, yyyy") : "Date unavailable"}
                          </span>
                        )}
                        <button
                          onClick={() => {
                            const href = resource.origin_type === "Product"
                              ? `/products/${resource.origin_id}`
                              : `/discussions/${resource.origin_id}`;
                            window.location.href = href;
                          }}
                          className="text-sme-gold hover:underline cursor-pointer font-mono text-[10px]"
                        >
                          View {resource.origin_type === "Product" ? "Product" : "Discussion"}
                        </button>
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
              );
            })}
          </div>
        )}
          </div>
          <aside className="lg:col-span-1">
            {/* Archive Filter Sidebar */}
            <div className="border border-translucent-emerald bg-muted-moss p-4">
              <h2 className="mb-4 font-serif text-lg font-semibold text-bone-white">Archive Filter</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setArchiveFilter("all")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase active:scale-95 ${
                    archiveFilter === "all"
                      ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                  }`}
                >
                  All Sources
                </button>
                <button
                  onClick={() => setArchiveFilter("Lab Reports")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${
                    archiveFilter === "Lab Reports"
                      ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                  }`}
                >
                  <FlaskConical size={12} />
                  Lab Reports
                </button>
                <button
                  onClick={() => setArchiveFilter("Clinical Research")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${
                    archiveFilter === "Clinical Research"
                      ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                  }`}
                >
                  <FileText size={12} />
                  Clinical Research
                </button>
                <button
                  onClick={() => setArchiveFilter("Product Audits")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${
                    archiveFilter === "Product Audits"
                      ? "border-sme-gold bg-sme-gold text-forest-obsidian"
                      : "border-translucent-emerald bg-forest-obsidian text-bone-white hover:bg-muted-moss hover:border-heart-green"
                  }`}
                >
                  <ClipboardList size={12} />
                  Product Audits
                </button>
                <button
                  onClick={() => setArchiveFilter("Field Notes")}
                  className={`w-full text-left border px-3 py-2 text-xs font-medium transition-colors font-mono uppercase flex items-center gap-2 active:scale-95 ${
                    archiveFilter === "Field Notes"
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
