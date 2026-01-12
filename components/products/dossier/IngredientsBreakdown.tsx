"use client";

import { Package, Pill, Beaker } from "lucide-react";

interface IngredientsBreakdownProps {
    ingredients: string | null;
    servingSize?: string | null;
    form?: string | null;
    coaUrl?: string | null;
}

export default function IngredientsBreakdown({
    ingredients,
    servingSize,
    form,
    coaUrl
}: IngredientsBreakdownProps) {
    // Don't render if no ingredients
    if (!ingredients) return null;

    // Parse ingredients - handle both free text and structured format
    const parseIngredients = (ingredientsText: string): Array<{ name: string; dosage?: string }> => {
        // Try to parse as structured list (e.g., "L-Theanine - 200mg, Caffeine - 100mg")
        const lines = ingredientsText.split(/[,\n]/).map(line => line.trim()).filter(Boolean);

        return lines.map(line => {
            // Match pattern: "Ingredient Name - Dosage"
            const match = line.match(/^(.+?)\s*[-–—]\s*(.+)$/);
            if (match) {
                return {
                    name: match[1].trim(),
                    dosage: match[2].trim()
                };
            }
            // No dosage specified
            return {
                name: line.trim()
            };
        });
    };

    const parsedIngredients = parseIngredients(ingredients);

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg mb-8">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Beaker className="w-6 h-6 text-emerald-400" />
                <h2 className="font-serif text-2xl md:text-3xl font-bold text-bone-white">
                    Active Ingredients
                </h2>
            </div>

            {/* Serving Info */}
            {(servingSize || form) && (
                <div className="flex flex-wrap gap-4 mb-6 text-sm">
                    {servingSize && (
                        <div className="flex items-center gap-2 text-bone-white/70">
                            <Package className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono">Serving Size: <span className="text-bone-white">{servingSize}</span></span>
                        </div>
                    )}
                    {form && (
                        <div className="flex items-center gap-2 text-bone-white/70">
                            <Pill className="w-4 h-4 text-emerald-400" />
                            <span className="font-mono">Form: <span className="text-bone-white">{form}</span></span>
                        </div>
                    )}
                </div>
            )}

            {/* Ingredients List */}
            <div className="space-y-3">
                {parsedIngredients.map((ingredient, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded"
                    >
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                        <div className="flex-1">
                            <span className="text-bone-white font-medium text-base md:text-lg">
                                {ingredient.name}
                            </span>
                            {ingredient.dosage && (
                                <span className="ml-2 text-emerald-400 font-mono text-sm md:text-base">
                                    {ingredient.dosage}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* COA Link */}
            {coaUrl && (
                <div className="mt-6 pt-6 border-t border-white/10">
                    <a
                        href={coaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors font-mono"
                    >
                        <Beaker className="w-4 h-4" />
                        View Certificate of Analysis (COA)
                        <span className="text-xs">↗</span>
                    </a>
                </div>
            )}

            {/* Note */}
            <p className="mt-6 text-xs text-bone-white/50 font-mono italic">
                * Per serving. Always consult with a healthcare professional before starting any new supplement regimen.
            </p>
        </div>
    );
}
