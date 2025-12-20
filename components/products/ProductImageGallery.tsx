"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

interface ProductImageGalleryProps {
  images: string[];
}

export default function ProductImageGallery({ images }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [isZoomed, setIsZoomed] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  // Ensure image URLs are full URLs
  const fullImageUrls = images
    .map((img) => {
      if (!img) return null;
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      console.warn('Image URL is not a full URL:', img);
      return null;
    })
    .filter((url): url is string => url !== null);

  if (fullImageUrls.length === 0) {
    return null;
  }

  const mainImage = fullImageUrls[selectedIndex] || '/placeholder.png';
  const hasMainImageError = imageErrors.has(selectedIndex);

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? fullImageUrls.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === fullImageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  };

  const handleZoom = () => {
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  // Handle keyboard navigation in zoom mode
  const handleZoomKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseZoom();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  return (
    <>
      <div>
        {/* Main Image - Black background to blend with dark theme */}
        <div 
          className="relative mb-4 aspect-square w-full overflow-hidden border border-translucent-emerald bg-forest-obsidian p-4"
          role="button"
          tabIndex={0}
          onClick={handleZoom}
          onKeyDown={(e) => e.key === 'Enter' && handleZoom()}
          aria-label="Click to zoom image"
        >
          {hasMainImageError ? (
            <div className="flex h-full w-full items-center justify-center bg-muted-moss">
              <p className="text-bone-white/50 text-sm font-mono">Image not available</p>
            </div>
          ) : (
            <>
              <Image
                src={mainImage}
                alt={`Product image ${selectedIndex + 1}`}
                fill
                className="object-contain"
                priority
                unoptimized={mainImage.includes('supabase.co')}
                onError={() => handleImageError(selectedIndex)}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Zoom indicator overlay - Minimalist */}
              <div className="absolute inset-0 flex items-center justify-center bg-transparent transition-all duration-200 hover:bg-bone-white/5 group cursor-zoom-in">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 text-xs text-bone-white/70 font-mono">
                  <ZoomIn size={14} />
                  <span>Click to zoom</span>
                </div>
              </div>
            </>
          )}
          
          {/* Navigation arrows - only show if more than one image */}
          {fullImageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss/90 p-1.5 text-bone-white hover:text-bone-white hover:bg-muted-moss transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss/90 p-1.5 text-bone-white hover:text-bone-white hover:bg-muted-moss transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={16} />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 border border-translucent-emerald bg-muted-moss/90 px-2 py-1 text-xs text-bone-white font-mono">
                {selectedIndex + 1} / {fullImageUrls.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Row - 10 thumbnails with gold borders for active selection */}
        {fullImageUrls.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {fullImageUrls.slice(0, 10).map((image, index) => {
              const hasError = imageErrors.has(index);
              const isActive = selectedIndex === index;
              return (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden border transition-all ${
                    isActive
                      ? "border-sme-gold border-2"
                      : "border-translucent-emerald hover:border-heart-green opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  {hasError ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted-moss text-xs text-bone-white/50 font-mono">
                      Error
                    </div>
                  ) : (
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized={image.includes('supabase.co')}
                      onError={() => handleImageError(index)}
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom Modal - High Resolution for SME Reading */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-forest-obsidian p-4"
          onClick={handleCloseZoom}
          onKeyDown={handleZoomKeyDown}
          tabIndex={-1}
        >
          <button
            onClick={handleCloseZoom}
            className="absolute top-4 right-4 border border-translucent-emerald bg-muted-moss p-2 text-bone-white hover:text-bone-white hover:bg-forest-obsidian transition-colors"
            aria-label="Close zoom"
          >
            <X size={20} />
          </button>
          
          {/* Navigation in zoom */}
          {fullImageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss p-2.5 text-bone-white hover:text-bone-white hover:bg-forest-obsidian transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 border border-translucent-emerald bg-muted-moss p-2.5 text-bone-white hover:text-bone-white hover:bg-forest-obsidian transition-colors"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 border border-translucent-emerald bg-muted-moss px-3 py-1.5 text-xs text-bone-white font-mono">
                {selectedIndex + 1} / {fullImageUrls.length}
              </div>
            </>
          )}

          {/* High-resolution image for zoom */}
          <div 
            className="relative max-w-[90vw] max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={mainImage}
              alt={`Product image ${selectedIndex + 1} - zoomed`}
              fill
              className="object-contain"
              unoptimized={mainImage.includes('supabase.co')}
              sizes="90vw"
              quality={100}
            />
          </div>
        </div>
      )}
    </>
  );
}
