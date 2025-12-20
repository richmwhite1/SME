"use client";

import { useState, useEffect } from "react";
import { Radio } from "lucide-react";

interface TelegramPulseWidgetProps {
  className?: string;
}

export default function TelegramPulseWidget({ className = "" }: TelegramPulseWidgetProps) {
  const [insightCount, setInsightCount] = useState(0);

  useEffect(() => {
    // Fetch insight count from API or use a placeholder
    // For now, we'll use a placeholder that can be connected to actual data
    async function fetchInsightCount() {
      try {
        // TODO: Connect to actual API endpoint
        // const response = await fetch('/api/telegram/insights-today');
        // const data = await response.json();
        // setInsightCount(data.count);
        
        // Placeholder: Random count between 5-25
        setInsightCount(Math.floor(Math.random() * 20) + 5);
      } catch (error) {
        console.error("Error fetching insight count:", error);
        setInsightCount(0);
      }
    }

    fetchInsightCount();
    
    // Update every 5 minutes
    const interval = setInterval(fetchInsightCount, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`border-b border-translucent-emerald bg-forest-obsidian px-4 py-2.5 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="relative flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sme-gold opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sme-gold"></span>
          </span>
          <Radio size={12} className="text-sme-gold" />
        </div>
        <span className="text-xs font-mono uppercase tracking-wider text-bone-white">
          Live Signal: <span className="text-sme-gold">{insightCount}</span> Insights Shared to Community Channels Today
        </span>
      </div>
    </div>
  );
}



