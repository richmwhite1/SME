'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function CommentForm({ discussionId }: { discussionId: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsArchiving(true);
    setError('');

    try {
      // Call server action to insert comment using raw SQL
      const response = await fetch('/api/discussions/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          discussion_id: discussionId,
          author_id: user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
      }

      setContent('');
      router.refresh(); // Forces the UI to show the new 'Signal' instantly
    } catch (err) {
      console.error('Signal Interrupted:', err instanceof Error ? err.message : 'Unknown error');
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded p-3 text-red-200 text-sm">
          {error}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Record your community signal..."
        className="w-full bg-black/40 border border-sme-gold/20 rounded p-4 text-bone-white font-mono text-sm focus:border-emerald-aura outline-none transition-colors"
        rows={4}
      />
      <button
        type="submit"
        disabled={isArchiving || !content.trim()}
        className="bg-sme-gold text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
      >
        {isArchiving ? 'Archiving Signal...' : 'Post Signal'}
      </button>
    </form>
  );
}



