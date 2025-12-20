import { redirect } from "next/navigation";
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

  if (discussion?.slug) {
    // Redirect to the discussion page using the slug
    redirect(`/discussions/${discussion.slug}`);
  } else {
    // If not found, try redirecting with the ID (the discussion page handles IDs as fallback)
    redirect(`/discussions/${id}`);
  }
}



