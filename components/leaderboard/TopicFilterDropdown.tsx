"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface TopicFilterDropdownProps {
  masterTopics: { name: string; display_order: number }[];
  currentTopic?: string;
}

export default function TopicFilterDropdown({
  masterTopics,
  currentTopic,
}: TopicFilterDropdownProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTopicChange = (topic: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (topic) {
      params.set("topic", topic);
    } else {
      params.delete("topic");
    }
    router.push(`/leaderboard?${params.toString()}`);
  };

  return (
    <div className="mb-6">
      <label htmlFor="topic-filter" className="mb-2 block text-sm font-medium text-slate-700">
        Filter by Master Topic:
      </label>
      <select
        id="topic-filter"
        value={currentTopic || ""}
        onChange={(e) => handleTopicChange(e.target.value)}
        className="rounded border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      >
        <option value="">All Topics</option>
        {masterTopics.map((topic) => (
          <option key={topic.name} value={topic.name}>
            {topic.name}
          </option>
        ))}
      </select>
    </div>
  );
}




