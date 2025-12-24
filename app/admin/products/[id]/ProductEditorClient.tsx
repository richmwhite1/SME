"use client";

import { useState } from "react";
import { Save, AlertCircle } from "lucide-react";
import ProductPhotoManager from "@/components/admin/ProductPhotoManager";
import SMEPreviewToggle from "@/components/admin/SMEPreviewToggle";
import TechnicalSpecsEditor from "@/components/wizard/TechnicalSpecsEditor";
import PhotoGrid from "@/components/wizard/PhotoGrid";
import { updateProductAdmin } from "@/app/actions/update-product-admin";

interface TechnicalSpec {
    key: string;
    value: string;
}

interface Product {
    id: string;
    name: string;
    category: string;
    brand?: string;
    company_blurb?: string;
    product_photos: string[];
    youtube_link?: string;
    technical_specs: Record<string, string>;
    created_at: string;
    updated_at: string;
}

interface ProductEditorClientProps {
    product: Product;
}

const CATEGORIES = [
    "Survivalist",
    "Detox",
    "Brain Fog",
    "Vitality",
    "Sleep",
    "Gut Health",
    "Hormones",
    "Performance",
    "Weight Loss",
    "Recovery",
];

export default function ProductEditorClient({
    product,
}: ProductEditorClientProps) {
    const [name, setName] = useState(product.name || "");
    const [category, setCategory] = useState(product.category || "");
    const [companyBlurb, setCompanyBlurb] = useState(product.company_blurb || "");
    const [photos, setPhotos] = useState<string[]>(product.product_photos || []);
    const [youtubeLink, setYoutubeLink] = useState(product.youtube_link || "");
    const [technicalSpecs, setTechnicalSpecs] = useState<TechnicalSpec[]>(
        Object.entries(product.technical_specs || {}).map(([key, value]) => ({
            key,
            value,
        }))
    );

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);

        try {
            // Convert technical specs array to object
            const specsObject = technicalSpecs.reduce((acc, spec) => {
                if (spec.key.trim() && spec.value.trim()) {
                    acc[spec.key.trim()] = spec.value.trim();
                }
                return acc;
            }, {} as Record<string, string>);

            const result = await updateProductAdmin({
                id: product.id,
                name,
                category,
                company_blurb: companyBlurb,
                product_photos: photos,
                youtube_link: youtubeLink || null,
                technical_specs: specsObject,
            });

            if (result.success) {
                setSaveMessage({ type: "success", text: "Product updated successfully!" });
            } else {
                setSaveMessage({
                    type: "error",
                    text: result.error || "Failed to update product",
                });
            }
        } catch (error) {
            setSaveMessage({ type: "error", text: "An unexpected error occurred" });
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const validateYouTubeUrl = (url: string): boolean => {
        if (!url) return true;
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        return youtubeRegex.test(url);
    };

    return (
        <SMEPreviewToggle>
            {(isPreview) => (
                <div className="space-y-8">
                    {/* Save Button */}
                    {!isPreview && (
                        <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                            <div>
                                {saveMessage && (
                                    <div
                                        className={`flex items-center gap-2 text-sm ${saveMessage.type === "success"
                                                ? "text-emerald-400"
                                                : "text-red-400"
                                            }`}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {saveMessage.text}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-emerald-600/10 border border-emerald-500/50 px-6 py-2 text-xs uppercase tracking-wider text-emerald-400 hover:bg-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    )}

                    {/* Product Details */}
                    <div className="border border-gray-700 bg-[#111] p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">
                            Product Details
                        </h3>

                        {isPreview ? (
                            // Preview Mode
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        Product Name
                                    </p>
                                    <p className="text-white">{name}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        Category
                                    </p>
                                    <p className="text-white">{category}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                        Company Blurb
                                    </p>
                                    <p className="text-gray-300 whitespace-pre-wrap">
                                        {companyBlurb}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            // Edit Mode
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors text-gray-300"
                                    >
                                        <option value="">Select Category...</option>
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                                        Company Blurb
                                    </label>
                                    <textarea
                                        value={companyBlurb}
                                        onChange={(e) => setCompanyBlurb(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors min-h-[200px]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Media Assets */}
                    <div className="border border-gray-700 bg-[#111] p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">
                            Media Assets
                        </h3>

                        {isPreview ? (
                            // Preview Mode
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                                        Product Photos
                                    </p>
                                    <PhotoGrid photos={photos} onDelete={() => { }} editable={false} />
                                </div>
                                {youtubeLink && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                                            YouTube Link
                                        </p>
                                        <a
                                            href={youtubeLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 underline"
                                        >
                                            {youtubeLink}
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Edit Mode
                            <div className="space-y-4">
                                <ProductPhotoManager photos={photos} onUpdate={setPhotos} />

                                <div>
                                    <label className="text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                                        YouTube Link
                                    </label>
                                    <input
                                        type="url"
                                        value={youtubeLink}
                                        onChange={(e) => setYoutubeLink(e.target.value)}
                                        className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                                        placeholder="https://youtube.com/... or https://youtu.be/..."
                                    />
                                    {youtubeLink && !validateYouTubeUrl(youtubeLink) && (
                                        <p className="text-xs text-red-400 mt-1">
                                            Please enter a valid YouTube URL
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Technical Specifications */}
                    <div className="border border-gray-700 bg-[#111] p-6 space-y-6">
                        <h3 className="text-lg font-semibold text-white uppercase tracking-wider border-b border-gray-700 pb-2">
                            Technical Specifications
                        </h3>

                        {isPreview ? (
                            // Preview Mode
                            <div className="space-y-2">
                                {technicalSpecs.length === 0 ? (
                                    <p className="text-gray-600 text-sm">
                                        No technical specifications
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {technicalSpecs.map((spec, index) => (
                                            <div key={index} className="border-l-2 border-emerald-500 pl-3">
                                                <p className="text-xs uppercase tracking-wider text-gray-500">
                                                    {spec.key}
                                                </p>
                                                <p className="text-white">{spec.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Edit Mode
                            <TechnicalSpecsEditor
                                specs={technicalSpecs}
                                onChange={setTechnicalSpecs}
                            />
                        )}
                    </div>
                </div>
            )}
        </SMEPreviewToggle>
    );
}
