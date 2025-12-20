import { redirect, notFound } from "next/navigation";
export const dynamic = "force-dynamic";
interface ProfileData {
  username: string | null;
}
export default async function ProfileByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Fetch profile by ID to get username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", id)
    .single() as { data: ProfileData | null, error: any };
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
