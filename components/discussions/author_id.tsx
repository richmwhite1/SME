'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function CommentForm({ discussionId }: { discussionId: string }) {
  const { user } = useUser();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsArchiving(true);
    const supabase = createClient();

    // Map Clerk user.id to author_id and use 'minimal' to prevent RLS select errors
    const { error } = await supabase
      .from('discussion_comments')
      .insert({
        content: content.trim(),
        discussion_id: discussionId,
        author_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Signal Interrupted:', error.message);
      setIsArchiving(false);
    } else {
      setContent('');
      setIsArchiving(false);
      router.refresh(); // Forces the UI to show the new 'Signal' instantly
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Record your community signal..."
        className="w-full bg-black/40 border border-sme-gold/20 rounded p-4 text-bone-white font-mono text-sm focus:border-emerald-aura outline-none transition-colors"
        rows={4}
      />
      <button
        type="submit"
        disabled={isArchiving}
        className="bg-sme-gold text-black px-6 py-2 rounded font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
      >
        {isArchiving ? 'Archiving Signal...' : 'Post Signal'}
      </button>
    </form>
  );
}



