"use client";

import { useState } from "react";
import DiscussionCard from "@/components/discussions/DiscussionCard";
import Button from "@/components/ui/Button";
import { fetchDiscussions } from "@/app/actions/discussion-actions";
import { Loader2 } from "lucide-react";

interface DiscussionListProps {
    initialDiscussions: any[];
    filters: {
        trusted?: boolean;
        topic?: string;
        search?: string;
        sort?: string;
    };
}

export default function DiscussionList({ initialDiscussions, filters }: DiscussionListProps) {
    const [discussions, setDiscussions] = useState(initialDiscussions);
    const [offset, setOffset] = useState(initialDiscussions.length);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialDiscussions.length === 20); // Assuming limit is 20

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const newDiscussions = await fetchDiscussions(offset, 20, filters);
            if (newDiscussions.length > 0) {
                setDiscussions((prev) => [...prev, ...newDiscussions]);
                setOffset((prev) => prev + newDiscussions.length);
                if (newDiscussions.length < 20) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Failed to load more discussions", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {discussions.map((discussion) => (
                <DiscussionCard key={discussion.id} discussion={discussion} />
            ))}

            {hasMore && (
                <div className="pt-8 text-center">
                    <Button
                        variant="outline"
                        onClick={loadMore}
                        className="min-w-[200px] border-translucent-emerald text-bone-white/70 hover:text-bone-white hover:border-sme-gold"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="animate-spin" size={16} /> Loading...
                            </span>
                        ) : (
                            "Load More Discussions"
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
