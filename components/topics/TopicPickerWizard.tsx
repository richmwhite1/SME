'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { toggleTopicFollow } from '@/app/actions/topic-actions';

interface MasterTopic {
    name: string;
    description: string | null;
    icon?: string;
}

export default function TopicPickerWizard() {
    const router = useRouter();
    const [topics, setTopics] = useState<MasterTopic[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchTopics() {
            try {
                const res = await fetch('/api/topics/master');
                if (res.ok) {
                    const data = await res.json();
                    setTopics(data);
                }
            } catch (error) {
                console.error('Failed to fetch master topics', error);
            } finally {
                setLoading(false);
            }
        }
        fetchTopics();
    }, []);

    const handleToggle = (topicName: string) => {
        const newSelected = new Set(selectedTopics);
        if (newSelected.has(topicName)) {
            newSelected.delete(topicName);
        } else {
            newSelected.add(topicName);
        }
        setSelectedTopics(newSelected);
    };

    const handleContinue = async () => {
        if (selectedTopics.size === 0) return;

        setSubmitting(true);
        try {
            // Follow all selected topics - wait for ALL to complete
            const promises = Array.from(selectedTopics).map(topic =>
                toggleTopicFollow(topic)
            );
            const results = await Promise.all(promises);

            // Verify all succeeded
            const allSucceeded = results.every(r => r?.success);
            if (!allSucceeded) {
                throw new Error('Some topics failed to save');
            }

            // Navigate to feed after ALL database operations complete successfully
            router.push('/feed');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert(error instanceof Error ? error.message : 'Failed to save topic preferences. Please try again.');
            setSubmitting(false); // Reset state on error so user can retry
        }
        // Note: Don't reset submitting on success - let the refresh handle the state change
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-heart-green border-t-transparent" />
                    <p className="text-sm font-mono text-bone-white/50">Loading topics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl py-12">
            <div className="mb-12 text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-full bg-forest-obsidian border border-translucent-emerald px-4 py-1.5 ring-1 ring-heart-green/20">
                    <Sparkles size={14} className="mr-2 text-heart-green" />
                    <span className="text-xs font-mono font-medium text-heart-green uppercase tracking-wider">
                        Personalize Your Experience
                    </span>
                </div>
                <h1 className="mb-4 font-serif text-4xl font-bold text-bone-white md:text-5xl">
                    What are you interested in?
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-bone-white/70 font-mono">
                    Select a few topics to help us curate your personalized intelligence feed.
                    You can always change this later.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => {
                    const isSelected = selectedTopics.has(topic.name);
                    return (
                        <button
                            key={topic.name}
                            onClick={() => handleToggle(topic.name)}
                            className={`group relative flex items-start gap-4 rounded-xl border p-6 text-left transition-all duration-300 ${isSelected
                                ? 'border-heart-green bg-heart-green/10 ring-1 ring-heart-green/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                }`}
                        >
                            <div
                                className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border transition-colors ${isSelected
                                    ? 'border-heart-green bg-heart-green text-forest-black'
                                    : 'border-white/10 bg-white/5 text-bone-white/50 group-hover:text-bone-white'
                                    }`}
                            >
                                {isSelected ? (
                                    <Check size={20} className="animate-in zoom-in spin-in-45 duration-300" />
                                ) : (
                                    <span className="text-lg font-serif italic">
                                        {topic.name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className={`font-serif text-lg font-bold transition-colors ${isSelected ? 'text-heart-green' : 'text-bone-white'
                                    }`}>
                                    {topic.name}
                                </h3>
                                {topic.description && (
                                    <p className="mt-1 text-sm text-bone-white/60 line-clamp-2">
                                        {topic.description}
                                    </p>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="fixed bottom-0 left-0 right-0 border-t border-translucent-emerald bg-forest-black/80 p-6 backdrop-blur-md md:static md:mt-12 md:border-none md:bg-transparent md:p-0 md:backdrop-blur-none transition-all duration-500 transform translate-y-0">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <div className="text-sm font-mono text-bone-white/50">
                        <span className={selectedTopics.size > 0 ? 'text-heart-green' : ''}>
                            {selectedTopics.size}
                        </span>{' '}
                        selected
                    </div>
                    <button
                        onClick={handleContinue}
                        disabled={selectedTopics.size === 0 || submitting}
                        className={`group flex items-center gap-2 rounded-full px-8 py-3 font-mono text-sm font-medium uppercase tracking-wider transition-all duration-300 ${selectedTopics.size > 0
                            ? 'bg-heart-green text-forest-black hover:bg-heart-green/90 hover:scale-105 shadow-lg shadow-heart-green/20'
                            : 'cursor-not-allowed bg-white/10 text-bone-white/30'
                            }`}
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-black/50 border-t-forest-black" />
                                Setting up...
                            </span>
                        ) : (
                            <>
                                Continue to Feed
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Spacer for fixed bottom bar on mobile */}
            <div className="h-24 md:hidden" />
        </div>
    );
}
