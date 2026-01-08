"use client";

import { useProductWizardStore } from "@/lib/stores/product-wizard-store";
import { useState } from "react";
import { AlertCircle, Plus, X, Image, Video, FileText } from "lucide-react";
import CloudinaryUploadWidget from "../CloudinaryUploadWidget";
import PhotoGrid from "../PhotoGrid";

export default function Step2Configuration() {
    const { data, updateData } = useProductWizardStore();

    const [photos, setPhotos] = useState<string[]>(data.product_photos || []);
    const [videoUrl, setVideoUrl] = useState(data.video_url || "");
    const [techDocsUrl, setTechDocsUrl] = useState(data.technical_docs_url || "");

    const MAX_PHOTOS = 10;

    const handlePhotoUpload = (url: string) => {
        if (photos.length < MAX_PHOTOS) {
            const updated = [...photos, url];
            setPhotos(updated);
            updateData({ product_photos: updated });
        }
    };

    const handlePhotoDelete = (index: number) => {
        const updated = photos.filter((_, i) => i !== index);
        setPhotos(updated);
        updateData({ product_photos: updated });
    };

    const handlePhotoReorder = (fromIndex: number, toIndex: number) => {
        const updated = [...photos];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setPhotos(updated);
        updateData({ product_photos: updated });
    };

    const handleVideoUrlChange = (value: string) => {
        setVideoUrl(value);
        updateData({ video_url: value });
    };

    const handleTechDocsChange = (value: string) => {
        setTechDocsUrl(value);
        updateData({ technical_docs_url: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 border-l-2 border-emerald-500 pl-4">
                <h2 className="text-xl font-semibold text-white uppercase tracking-wider">II. Visuals & Media</h2>
                <p className="text-gray-500 text-sm mt-1">The "Show, Don't Tell" Step — Visual assets and documentation</p>
            </div>

            {/* Product Photos with Cloudinary */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image className="w-4 h-4 text-emerald-500" />
                        <label className="text-xs uppercase tracking-wider text-gray-500">
                            Product Photos ({photos.length}/{MAX_PHOTOS})
                        </label>
                    </div>
                    <CloudinaryUploadWidget
                        onUpload={handlePhotoUpload}
                        maxPhotos={MAX_PHOTOS}
                        currentCount={photos.length}
                    />
                </div>
                <p className="text-xs text-gray-600">
                    Upload high-resolution product images. Photos will be automatically resized to 1200px width.
                </p>

                <PhotoGrid
                    photos={photos}
                    onDelete={handlePhotoDelete}
                    onReorder={handlePhotoReorder}
                />
            </div>

            {/* Video URL */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">YouTube / Video Link</label>
                </div>
                <input
                    value={videoUrl}
                    onChange={(e) => handleVideoUrlChange(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="https://youtube.com/watch?v=..."
                />
                <p className="text-xs text-gray-600">
                    Optional: Product demo, walkthrough, or founder explanation video.
                </p>
            </div>

            {/* Technical Documentation */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">Technical Documentation Link</label>
                </div>
                <input
                    value={techDocsUrl}
                    onChange={(e) => handleTechDocsChange(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="https://..."
                />
                <p className="text-xs text-gray-600">
                    Optional: Link to manuals, whitepapers, or API documentation.
                </p>
            </div>

        </div>
    );
}
