import { PRIMARY_CATEGORY_DESCRIPTIONS, SECONDARY_CATEGORY_TYPE_LABELS, type PrimaryCategory, type SecondaryCategories } from "@/lib/constants/product-categories";

interface ProductCategoryDisplayProps {
    primaryCategory: string | null;
    secondaryCategories?: SecondaryCategories | null;
    className?: string;
}

export default function ProductCategoryDisplay({
    primaryCategory,
    secondaryCategories,
    className = ""
}: ProductCategoryDisplayProps) {
    if (!primaryCategory && (!secondaryCategories || Object.values(secondaryCategories).every(arr => arr.length === 0))) {
        return null;
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Foundational Health':
                return 'bg-blue-900/30 text-blue-400 border-blue-800';
            case 'Targeted Support':
                return 'bg-purple-900/30 text-purple-400 border-purple-800';
            case 'Lifestyle & Performance':
                return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
            case 'Specialized Needs':
                return 'bg-orange-900/30 text-orange-400 border-orange-800';
            default:
                return 'bg-gray-900/30 text-gray-400 border-gray-800';
        }
    };

    const getTagColor = (type: keyof SecondaryCategories) => {
        switch (type) {
            case 'conditions':
                return 'bg-red-900/20 text-red-400 border-red-900/50';
            case 'goals':
                return 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50';
            case 'ingredients':
                return 'bg-purple-900/20 text-purple-400 border-purple-900/50';
            case 'forms':
                return 'bg-blue-900/20 text-blue-400 border-blue-900/50';
            default:
                return 'bg-gray-900/20 text-gray-400 border-gray-900/50';
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Primary Category */}
            {primaryCategory && (
                <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Primary Category</h3>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getCategoryColor(primaryCategory)}`}>
                        <span className="font-semibold">{primaryCategory}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {PRIMARY_CATEGORY_DESCRIPTIONS[primaryCategory as PrimaryCategory]}
                    </p>
                </div>
            )}

            {/* Secondary Categories */}
            {secondaryCategories && Object.entries(secondaryCategories).some(([_, items]) => items.length > 0) && (
                <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Tags</h3>
                    <div className="space-y-3">
                        {(Object.entries(secondaryCategories) as [keyof SecondaryCategories, string[]][]).map(([type, items]) => {
                            if (items.length === 0) return null;

                            return (
                                <div key={type}>
                                    <p className="text-xs text-gray-600 mb-1.5">
                                        {SECONDARY_CATEGORY_TYPE_LABELS[type]}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(item => (
                                            <span
                                                key={item}
                                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${getTagColor(type)}`}
                                            >
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
