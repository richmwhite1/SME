import { redirect, notFound } from "next/navigation";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

interface DiscussionResult {
  slug: string | null;
}

export default async function CommunityRedirect({ params }: { params: { id: string } }) {
  const { id } = params;
  const sql = getDb();

  try {
    // Fetch discussion slug using raw SQL
    const discussions = await sql<DiscussionResult[]>`
      SELECT slug
      FROM discussions
      WHERE id::text = ${id} OR slug = ${id}
      LIMIT 1
    `;

    // Proper null check - discussion array should have at least one element
    if (!discussions || discussions.length === 0) {
      return notFound();
    }

    const discussion = discussions[0];

    // Check if slug exists and is valid
    if (!discussion.slug || typeof discussion.slug !== 'string') {
      return notFound();
    }

    // Force the redirect
    return redirect(`/discussions/${discussion.slug}`);
  } catch (error) {
    console.error("Error fetching discussion:", error);
    return notFound();
  }
}



