"use client";

import { useState } from "react";
import CloudinaryUploadWidget from "@/components/wizard/CloudinaryUploadWidget";
import PhotoGrid from "@/components/wizard/PhotoGrid";

interface ProductPhotoManagerProps {
    photos: string[];
    onUpdate: (photos: string[]) => void;
    maxPhotos?: number;
}

export default function ProductPhotoManager({
    photos,
    onUpdate,
    maxPhotos = 10,
}: ProductPhotoManagerProps) {
    const [localPhotos, setLocalPhotos] = useState<string[]>(photos);

    const handlePhotoUpload = (url: string) => {
        if (localPhotos.length < maxPhotos) {
            const updated = [...localPhotos, url];
            setLocalPhotos(updated);
            onUpdate(updated);
        }
    };

    const handlePhotoDelete = (index: number) => {
        const updated = localPhotos.filter((_, i) => i !== index);
        setLocalPhotos(updated);
        onUpdate(updated);
    };

    const handlePhotoReorder = (fromIndex: number, toIndex: number) => {
        const updated = [...localPhotos];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        setLocalPhotos(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-wider text-emerald-500">
                    Photo Management ({localPhotos.length}/{maxPhotos})
                </h3>
                <CloudinaryUploadWidget
                    onUpload={handlePhotoUpload}
                    maxPhotos={maxPhotos}
                    currentCount={localPhotos.length}
                />
            </div>

            <PhotoGrid
                photos={localPhotos}
                onDelete={handlePhotoDelete}
                onReorder={handlePhotoReorder}
            />

            <p className="text-xs text-gray-600">
                Drag photos to reorder. Click X to delete. Photos are auto-resized to
                1200px width.
            </p>
        </div>
    );
}
