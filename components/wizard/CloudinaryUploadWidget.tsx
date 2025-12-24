"use client";

import { useEffect, useRef } from "react";
import { Upload } from "lucide-react";

interface CloudinaryUploadWidgetProps {
    onUpload: (url: string) => void;
    maxPhotos: number;
    currentCount: number;
}

declare global {
    interface Window {
        cloudinary: any;
    }
}

export default function CloudinaryUploadWidget({
    onUpload,
    maxPhotos,
    currentCount,
}: CloudinaryUploadWidgetProps) {
    const widgetRef = useRef<any>(null);

    useEffect(() => {
        // Load Cloudinary widget script
        if (!document.getElementById("cloudinary-upload-widget")) {
            const script = document.createElement("script");
            script.id = "cloudinary-upload-widget";
            script.src = "https://upload-widget.cloudinary.com/global/all.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const openWidget = () => {
        if (currentCount >= maxPhotos) {
            alert(`Maximum ${maxPhotos} photos allowed`);
            return;
        }

        // Initialize widget if not already done
        if (!widgetRef.current && window.cloudinary) {
            widgetRef.current = window.cloudinary.createUploadWidget(
                {
                    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "YOUR_CLOUD_NAME",
                    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "unsigned_preset",
                    sources: ["local", "url", "camera"],
                    multiple: false,
                    maxFiles: 1,
                    clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
                    maxFileSize: 10000000, // 10MB
                    resourceType: "auto",
                    transformation: [
                        {
                            width: 1200,
                            crop: "limit", // Resize to max 1200px width, maintain aspect ratio
                            quality: "auto:good",
                            fetch_format: "auto",
                        },
                    ],
                    styles: {
                        palette: {
                            window: "#0a0a0a",
                            windowBorder: "#10b981",
                            tabIcon: "#10b981",
                            menuIcons: "#e5e5e5",
                            textDark: "#000000",
                            textLight: "#e5e5e5",
                            link: "#10b981",
                            action: "#10b981",
                            inactiveTabIcon: "#555555",
                            error: "#ef4444",
                            inProgress: "#10b981",
                            complete: "#10b981",
                            sourceBg: "#111111",
                        },
                    },
                },
                (error: any, result: any) => {
                    if (!error && result && result.event === "success") {
                        onUpload(result.info.secure_url);
                    }
                }
            );
        }

        // Open the widget
        widgetRef.current?.open();
    };

    const isDisabled = currentCount >= maxPhotos;

    return (
        <button
            type="button"
            onClick={openWidget}
            disabled={isDisabled}
            className={`
        flex items-center gap-2 px-6 py-3 border transition-all
        ${isDisabled
                    ? "border-gray-700 bg-gray-900/50 text-gray-600 cursor-not-allowed"
                    : "border-emerald-500/50 bg-emerald-900/10 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-500"
                }
      `}
        >
            <Upload className="w-4 h-4" />
            {isDisabled ? `Max ${maxPhotos} Photos` : "Upload Photo / PDF"}
        </button>
    );
}
