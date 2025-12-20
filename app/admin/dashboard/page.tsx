import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const adminStatus = await isAdmin();
  if (!adminStatus) {
    redirect("/");
  }
  // Redirect to unified admin portal
  redirect("/admin");
}
