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
