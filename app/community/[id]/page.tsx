import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// 1. Define the interface so TypeScript knows what a 'Discussion' is
interface DiscussionResult {
  slug: string;
}

export default async function CommunityRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = createClient();

  // 2. Explicitly type the result as DiscussionResult or null
  const { data: discussion } = await supabase
    .from('discussions')
    .select('slug')
    .eq('id', id)
    .single() as { data: DiscussionResult | null };

  // 3. This guard now works because TypeScript knows 'discussion' can have a slug
  if (!discussion || !discussion.slug) {
    return notFound();
  }

  // 4. Force the redirect
  return redirect(`/discussions/${discussion.slug}`);
}



