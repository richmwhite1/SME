import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CommunityDiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  // 1. Fetch the data
  const { data: discussion } = await supabase
    .from('discussions')
    .select('slug')
    .eq('id', id)
    .single();

  // 2. Add this strict guard clause
  if (!discussion || !discussion.slug) {
    return notFound();
  }

  // 3. TypeScript now knows 'discussion' MUST have a slug
  return redirect(`/discussions/${discussion.slug}`);
}



