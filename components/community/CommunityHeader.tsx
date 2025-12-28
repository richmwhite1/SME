"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";

export default function CommunityHeader() {
    const { replace } = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }

    return (
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
                <h1 className="font-serif text-4xl font-bold text-bone-white">The Community</h1>
                <p className="mt-2 text-bone-white/70">
                    Connect with experts, researchers, and fellow biohackers.
                </p>
            </div>

            <div className="relative w-full md:w-96">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-bone-white/40" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name, pillar, or bio..."
                    className="w-full rounded bg-forest-obsidian border border-translucent-emerald py-2.5 pl-10 pr-4 text-sm text-bone-white placeholder:text-bone-white/30 focus:border-sme-gold focus:outline-none"
                    defaultValue={searchParams.get("q")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
        </div>
    );
}
