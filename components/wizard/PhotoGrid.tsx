"use client";

import { X } from "lucide-react";
import Image from "next/image";

interface PhotoGridProps {
    photos: string[];
    onDelete: (index: number) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
    editable?: boolean;
}

export default function PhotoGrid({
    photos,
    onDelete,
    onReorder,
    editable = true,
}: PhotoGridProps) {
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        if (onReorder && fromIndex !== toIndex) {
            onReorder(fromIndex, toIndex);
        }
    };

    if (photos.length === 0) {
        return (
            <div className="border border-dashed border-gray-700 p-8 text-center text-gray-600">
                No photos uploaded yet
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {photos.map((url, index) => (
                <div
                    key={`${url}-${index}`}
                    draggable={editable && onReorder !== undefined}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`
            relative aspect-square border border-gray-700 bg-gray-900 overflow-hidden group
            ${editable && onReorder ? "cursor-move" : ""}
          `}
                >
                    <Image
                        src={url}
                        alt={`Product photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23222" width="200" height="200"/%3E%3Ctext fill="%23666" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage Unavailable%3C/text%3E%3C/svg%3E';
                        }}
                    />
                    {editable && (
                        <button
                            type="button"
                            onClick={() => onDelete(index)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Delete photo"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 text-center">
                        Photo {index + 1}
                    </div>
                </div>
            ))}
        </div>
    );
}
