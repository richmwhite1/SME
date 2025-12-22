"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import Button from "@/components/ui/Button";

interface TaggingInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
}

import { getMasterTopics } from "@/app/actions/topic-actions";

export default function TaggingInput({
  selectedTags,
  onTagsChange,
  maxTags = 5,
}: TaggingInputProps) {
  const [masterTopics, setMasterTopics] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMasterTopics() {
      try {
        const topics = await getMasterTopics();
        setMasterTopics(topics.map((t: any) => t.name));
      } catch (error) {
        console.error("Error fetching master topics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMasterTopics();
  }, []);

  const handleToggleMasterTopic = (topic: string) => {
    if (selectedTags.includes(topic)) {
      onTagsChange(selectedTags.filter((t) => t !== topic));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, topic]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (
      trimmed &&
      selectedTags.length < maxTags &&
      !selectedTags.includes(trimmed) &&
      !masterTopics.includes(trimmed)
    ) {
      onTagsChange([...selectedTags, trimmed]);
      setCustomTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-4">
      {/* Master Topics Pills */}
      {!loading && masterTopics.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-deep-stone">
            Select Topics
          </label>
          <div className="flex flex-wrap gap-2">
            {masterTopics.map((topic) => {
              const isSelected = selectedTags.includes(topic);
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleToggleMasterTopic(topic)}
                  disabled={!isSelected && selectedTags.length >= maxTags}
                  className={`relative rounded-full px-3 py-1 text-sm font-medium transition-all duration-200 ${isSelected
                    ? "bg-earth-green text-sand-beige"
                    : "bg-earth-green/20 text-earth-green hover:bg-earth-green/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                >
                  <span className="mr-1.5 text-xs">⭐</span>
                  {topic}
                  <span className="ml-1.5 rounded-full bg-white/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase">
                    Core
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      <div>
        <label className="mb-2 block text-sm font-medium text-deep-stone">
          Custom Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
            placeholder="Type a custom tag..."
            disabled={selectedTags.length >= maxTags}
            className="flex-1 rounded-lg border border-soft-clay/30 bg-white/70 px-4 py-2 text-deep-stone focus:border-earth-green focus:outline-none disabled:opacity-50"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleAddCustomTag}
            disabled={!customTagInput.trim() || selectedTags.length >= maxTags}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add
          </Button>
        </div>
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-deep-stone">
            Selected Tags ({selectedTags.length}/{maxTags})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-2 rounded-full bg-earth-green/20 px-3 py-1 text-sm text-earth-green"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-earth-green/70"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-deep-stone/60">
        Select from suggested topics or add your own. Maximum {maxTags} tags.
      </p>
    </div>
  );
}

