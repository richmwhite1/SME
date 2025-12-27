import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { seedUserReputation, getUserReputationStatus } from "@/app/actions/reputation-actions";

export default async function SMETestPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const sql = getDb();

    // Verify admin status
    const profile = await sql`
    SELECT is_admin FROM profiles WHERE id = ${user.id}
  `;

    if (!profile[0]?.is_admin) {
        redirect("/?error=admin_required");
    }

    // Get current status of test user
    let testUserStatus = null;
    try {
        const testUsers = await sql`
      SELECT id, full_name, email, reputation_score, is_sme
      FROM profiles
      WHERE email = 'richmwhite@gmail.com'
    `;
        testUserStatus = testUsers[0] || null;
    } catch (error) {
        console.error("Error fetching test user:", error);
    }

    return (
        <div className="min-h-screen bg-forest-obsidian p-8">
            <div className="container mx-auto max-w-4xl">
                <h1 className="text-3xl font-serif text-bone-white mb-8">
                    SME Reputation Lifecycle - Test Page
                </h1>

                {/* Test User Status */}
                <div className="mb-8 border border-sme-gold/30 bg-sme-gold/5 p-6 rounded-lg">
                    <h2 className="text-xl font-serif text-sme-gold mb-4">
                        Test User Status: richmwhite@gmail.com
                    </h2>
                    {testUserStatus ? (
                        <div className="space-y-2 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-bone-white/60">Name:</span>
                                <span className="text-bone-white">{testUserStatus.full_name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-bone-white/60">Email:</span>
                                <span className="text-bone-white">{testUserStatus.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-bone-white/60">Reputation Score:</span>
                                <span className="text-bone-white font-bold">{testUserStatus.reputation_score || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-bone-white/60">SME Status:</span>
                                <span className={testUserStatus.is_sme ? "text-sme-gold font-bold" : "text-bone-white/60"}>
                                    {testUserStatus.is_sme ? "✅ ACTIVE" : "❌ INACTIVE"}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-bone-white/60 font-mono text-sm">
                            User not found. Please sign in as richmwhite@gmail.com at least once.
                        </p>
                    )}
                </div>

                {/* Test Actions */}
                <div className="space-y-4">
                    <h2 className="text-xl font-serif text-bone-white mb-4">Test Actions</h2>

                    {/* Seed User Button */}
                    <form action={async () => {
                        "use server";
                        const result = await seedUserReputation("richmwhite@gmail.com", 100);
                        if (result.success) {
                            redirect("/admin/sme-test?success=seeded");
                        } else {
                            redirect("/admin/sme-test?error=" + encodeURIComponent(result.error || "Failed to seed user"));
                        }
                    }}>
                        <button
                            type="submit"
                            className="w-full px-6 py-3 bg-sme-gold text-forest-obsidian font-mono font-bold uppercase tracking-wider hover:bg-sme-gold/80 transition-colors"
                        >
                            1. Seed Test User with 100 Upvotes
                        </button>
                        <p className="text-bone-white/60 text-sm mt-2 font-mono">
                            Creates mock upvotes to elevate richmwhite@gmail.com to SME status
                        </p>
                    </form>

                    {/* Manual Test Instructions */}
                    <div className="border border-translucent-emerald bg-muted-moss/20 p-6 rounded-lg">
                        <h3 className="text-lg font-serif text-bone-white mb-3">Manual Testing Steps</h3>
                        <ol className="space-y-3 text-bone-white/80 font-mono text-sm list-decimal list-inside">
                            <li>Click "Seed Test User" button above</li>
                            <li>Wait for success message and page reload</li>
                            <li>Verify reputation score is now ≥100 and SME Status is ACTIVE</li>
                            <li>Sign out and sign in as richmwhite@gmail.com</li>
                            <li>Check user dropdown - should see "SME Dashboard" link</li>
                            <li>Click "SME Dashboard" - should load successfully</li>
                            <li>
                                <strong>Test Demotion:</strong> Run this in browser console:
                                <code className="block mt-2 p-2 bg-forest-obsidian text-sme-gold">
                                    fetch('/api/admin/demote-test-user', {'{'} method: 'POST' {'}'}).then(r =&gt; r.json()).then(console.log)
                                </code>
                            </li>
                            <li>Refresh page - SME Dashboard link should disappear</li>
                            <li>Try accessing /sme-dashboard directly - should redirect with error toast</li>
                        </ol>
                    </div>

                    {/* Console Commands */}
                    <div className="border border-translucent-emerald bg-muted-moss/20 p-6 rounded-lg">
                        <h3 className="text-lg font-serif text-bone-white mb-3">Browser Console Commands</h3>
                        <div className="space-y-3 font-mono text-xs">
                            <div>
                                <p className="text-bone-white/60 mb-1">Check current reputation:</p>
                                <code className="block p-2 bg-forest-obsidian text-sme-gold">
                                    fetch('/api/profile').then(r =&gt; r.json()).then(p =&gt; console.log('Reputation:', p.reputation_score, 'SME:', p.is_sme))
                                </code>
                            </div>
                            <div>
                                <p className="text-bone-white/60 mb-1">Seed user (alternative method):</p>
                                <code className="block p-2 bg-forest-obsidian text-sme-gold">
                                    fetch('/api/admin/seed-test-user', {'{'} method: 'POST', headers: {'{'} 'Content-Type': 'application/json' {'}'}, body: JSON.stringify({'{'} email: 'richmwhite@gmail.com', targetScore: 100 {'}'}) {'}'}).then(r =&gt; r.json()).then(console.log)
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
