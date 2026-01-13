"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { ExternalLink } from "lucide-react";
import TelegramPulseWidget from "./TelegramPulseWidget";
import GlobalProgressBar from "@/components/milestones/GlobalProgressBar";
import MilestoneBanner from "@/components/milestones/MilestoneBanner";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  url?: string;
}

interface LatestIntelligenceProps {
  className?: string;
  maxItems?: number;
}

export default function LatestIntelligence({
  className = "",
  maxItems = 5,
}: LatestIntelligenceProps) {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Option 1: Use Twitter API (requires API key in env)
    // Option 2: Use Twitter embed/iframe
    // For now, we'll create a placeholder that can be easily connected to an API

    // If you have a Twitter API endpoint, uncomment and configure:
    /*
    async function fetchTweets() {
      try {
        const response = await fetch('/api/twitter/latest', {
          method: 'GET',
        });
        
        if (!response.ok) throw new Error('Failed to fetch tweets');
        
        const data = await response.json();
        setTweets(data.slice(0, maxItems));
      } catch (err) {
        console.error('Error fetching tweets:', err);
        setError('Unable to load latest updates');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTweets();
    */

    // Placeholder: Set loading to false after a delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [maxItems]);

  // If using Twitter embed instead of API, use this:
  const twitterUsername = "SME_Vibe"; // Replace with your actual Twitter handle

  return (
    <div className={`border border-translucent-emerald bg-muted-moss ${className}`}>
      {/* Global Progress Bar */}
      <GlobalProgressBar />

      {/* Milestone Celebration Banner */}
      <div className="px-4 pt-3">
        <MilestoneBanner />
      </div>

      {/* Telegram Pulse Widget */}
      <TelegramPulseWidget />

      <div className="border-b border-translucent-emerald px-4 py-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-bone-white font-mono">
          Recent Insights
        </h3>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="text-xs text-bone-white/70 font-mono">Loading...</div>
        </div>
      ) : error ? (
        <div className="p-6 text-center">
          <div className="text-xs text-bone-white/70 font-mono">{error}</div>
        </div>
      ) : tweets.length > 0 ? (
        <div className="divide-y divide-translucent-emerald">
          {tweets.map((tweet) => (
            <a
              key={tweet.id}
              href={tweet.url || `https://twitter.com/${twitterUsername}/status/${tweet.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 transition-colors hover:bg-forest-obsidian"
            >
              <p className="mb-2 text-sm leading-relaxed text-bone-white/90 font-mono">
                {tweet.text}
              </p>
              <div className="flex items-center justify-between text-xs text-bone-white/50">
                <span className="font-mono">
                  {new Date(tweet.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <ExternalLink size={12} className="text-bone-white/50" />
              </div>
            </a>
          ))}
        </div>
      ) : (
        // Fallback: Twitter embed or link to profile
        <div className="p-6">
          <div className="mb-4 text-center">
            <p className="mb-3 text-sm text-bone-white/70 font-mono">
              Follow us on X for the latest transparency reports and research insights.
            </p>
            <a
              href={`https://twitter.com/${twitterUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-translucent-emerald bg-forest-obsidian px-4 py-2 text-sm font-mono uppercase tracking-wider text-bone-white hover:text-[#B8860B] hover:border-[#B8860B] transition-all"
            >
              <span>Follow @{twitterUsername}</span>
              <ExternalLink size={14} />
            </a>
          </div>

          {/* Optional: Twitter Timeline Embed */}
          <div className="mt-4">
            <a
              className="twitter-timeline"
              data-height="400"
              data-theme="light"
              data-chrome="noheader nofooter noborders"
              href={`https://twitter.com/${twitterUsername}?ref_src=twsrc%5Etfw`}
            >
              Tweets by {twitterUsername}
            </a>
            <Script
              src="https://platform.twitter.com/widgets.js"
              strategy="lazyOnload"
            />
          </div>
        </div>
      )}
    </div>
  );
}




