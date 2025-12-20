import { redirect, notFound } from "next/navigation";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sql = getDb();

  // Fetch profile by ID to get username
  const result = await sql`
    SELECT username
    FROM profiles
    WHERE id = ${id}
    LIMIT 1
  `;
  
  const profile = result[0];

  if (!profile) {
    notFound();
  }

  // Redirect to username route if available, otherwise to /u/me
  if (profile.username) {
    redirect(`/u/${profile.username}`);
  } else {
    // If no username, redirect to /u/me which will handle it
    redirect("/u/me");
  }
}
