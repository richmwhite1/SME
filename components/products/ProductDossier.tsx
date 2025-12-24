import ProductRadarChart from '@/components/product/ProductRadarChart';
import { getYouTubeID } from '@/lib/youtube';

interface ProductDossierProps {
    product: {
        name: string;
        brand: string;
        job_to_be_done: string;
        community_consensus_score: number;
        founder_video_url?: string | null;
        certification_vault_urls?: string[] | null;
        ingredients_list?: string | null;
    };
    radarData: {
        scientific: number;
        alternative: number;
        esoteric: number;
        scientific_pct?: number;
        esoteric_pct?: number;
    };
    signals?: Array<{
        signal: string;
        lens_type: 'scientific' | 'alternative' | 'esoteric';
    }>;
}

export default function ProductDossier({ product, radarData, signals }: ProductDossierProps) {
    // Determine community vibe based on highest radar score
    const getCommunityVibe = () => {
        const { scientific, alternative, esoteric } = radarData;
        const max = Math.max(scientific, alternative, esoteric);

        if (scientific === max && scientific > 50) {
            return "Heavy focus on clinical data.";
        }
        if (esoteric === max && esoteric > 50) {
            return "Recognized for energetic/unseen properties.";
        }
        if (alternative === max && alternative > 50) {
            return "Rooted in ancestral wisdom and holistic protocols.";
        }
        return "A balanced holistic profile.";
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            {/* 1. The Authority Header (Always Visible) */}
            <header className="border-b border-zinc-800 pb-6">
                <h1 className="text-4xl font-bold text-bone-white">{product.name}</h1>
                <p className="text-xl text-zinc-400">
                    {product.brand} | {product.job_to_be_done}
                </p>
                <div className="mt-4 inline-block bg-zinc-900 px-4 py-2 rounded-full border border-zinc-700">
                    <span className="text-sm font-mono uppercase tracking-widest text-zinc-500">
                        Consensus Score:
                    </span>
                    <span className="ml-2 text-green-400 font-bold">
                        {product.community_consensus_score}%
                    </span>
                </div>
            </header>

            {/* 2. The Truth Balance (Always Visible) */}
            <section className="grid md:grid-cols-2 gap-8 items-center bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-zinc-200">Evidence Balance</h2>
                    <ProductRadarChart data={radarData} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-bone-white">Community Vibe</h3>
                    <p className="text-zinc-400 leading-relaxed">
                        {getCommunityVibe()}
                    </p>
                </div>
            </section>

            {/* 3. Founder Intent Video (CONDITIONAL) */}
            {product.founder_video_url && (
                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-bone-white">Founder&apos;s Intent</h2>
                    <div className="aspect-video rounded-xl overflow-hidden border border-zinc-800">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${getYouTubeID(product.founder_video_url)}`}
                            title="Founder Video"
                            allowFullScreen
                        />
                    </div>
                </section>
            )}

            {/* 4. Certification Vault (CONDITIONAL) */}
            {product.certification_vault_urls && product.certification_vault_urls.length > 0 && (
                <section className="bg-zinc-900 p-6 rounded-xl border-l-4 border-blue-500">
                    <h2 className="text-xl font-bold mb-4 text-bone-white">Verification Vault</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.certification_vault_urls.map((url, i) => (
                            <li key={i}>
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:underline flex items-center"
                                >
                                    📄 Lab Report / Certification {i + 1}
                                </a>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* 5. Ingredients (CONDITIONAL) */}
            {product.ingredients_list && (
                <section className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                    <h2 className="text-zinc-500 uppercase text-xs font-bold tracking-tighter mb-2">
                        Technical Breakdown
                    </h2>
                    <p className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">
                        {product.ingredients_list}
                    </p>
                </section>
            )}
        </div>
    );
}
