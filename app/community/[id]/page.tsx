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

  // Fetch discussion by id to get the slug
  const { data: discussion } = await supabase
    .from("discussions")
    .select("slug")
    .eq("id", id)
    .eq("is_flagged", false)
    .single();

  // Strict null check - discussion must exist and have a slug
  if (!discussion) {
    // Discussion not found or is flagged
    return notFound();
  }

  if (discussion.slug) {
    // Redirect to the discussion page using the slug
    redirect(`/discussions/${discussion.slug}`);
  } else {
    // If slug is missing (edge case), redirect with ID as fallback
    redirect(`/discussions/${id}`);
  }
}



