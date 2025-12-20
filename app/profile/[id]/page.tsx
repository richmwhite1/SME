import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient();

  // Fetch profile by ID to get username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .single();

  if (error || !profile) {
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



