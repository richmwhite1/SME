import { getCommunityUsers } from "@/app/actions/community";
import CommunityHeader from "@/components/community/CommunityHeader";
import FilterBar from "@/components/community/FilterBar";
import UserCard from "@/components/community/UserCard";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function CommunityPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; filter?: "all" | "sme" | "following"; pillars?: string }>;
}) {
    const params = await searchParams;
    const users = await getCommunityUsers({
        query: params.q,
        filter: params.filter,
        pillars: params.pillars ? params.pillars.split(",") : undefined,
    });

    return (
        <main className="min-h-screen bg-forest-obsidian px-6 py-12">
            <div className="mx-auto max-w-6xl">
                <CommunityHeader />

                {/* Telegram Community Section */}
                <div className="mb-8 rounded-xl border border-translucent-emerald bg-forest-obsidian/50 p-6 backdrop-blur-sm">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="space-y-2">
                            <h3 className="font-serif text-xl text-sme-gold">Join the Inner Circle</h3>
                            <p className="max-w-xl text-sm text-bone-white/70">
                                Connect with verified SMEs and like-minded health seekers in our private Telegram community.
                                Get real-time answers, participate in live Q&As, and access exclusive protocols.
                            </p>
                        </div>
                        <a
                            href="https://t.me/+AbC123XyZ"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg border border-sme-gold bg-sme-gold/10 px-6 py-3 text-sme-gold transition-all hover:bg-sme-gold hover:text-forest-obsidian"
                        >
                            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-2.02-1.35-2.9-2.01-.27-.2-.05-.82.26-1.14.07-.07 1.3-1.25 2.4-2.28 1.05-.98 2.05-2.06 1.1-2.06-.95 0-2.6 1.7-5.02 3.33-.36.25-.7.38-1.02.38-.85.02-2.5-.46-2.5-.46-.62-.18-.3-.65.23-.85 1.83-.8 7.37-2.9 8.23-3.26.85-.35 1.72-.45 1.62 1.35z" />
                            </svg>
                            <span className="font-mono text-sm uppercase tracking-wider font-bold">Join Telegram</span>
                        </a>
                    </div>
                </div>

                <FilterBar />

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Suspense fallback={<p>Loading users...</p>}>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <UserCard key={user.id} user={user} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-bone-white/50 text-lg">No members found matching your criteria.</p>
                            </div>
                        )}
                    </Suspense>
                </div>
            </div>
        </main>
    );
}
