"use client";

import { useState } from "react";
import { Eye, Edit } from "lucide-react";

interface SMEPreviewToggleProps {
    children: (isPreview: boolean) => React.ReactNode;
}

export default function SMEPreviewToggle({ children }: SMEPreviewToggleProps) {
    const [isPreview, setIsPreview] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                <h2 className="text-lg font-semibold text-white uppercase tracking-wider">
                    {isPreview ? "SME Preview Mode" : "Edit Mode"}
                </h2>
                <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`
            flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider transition-all border
            ${isPreview
                            ? "bg-blue-900/20 border-blue-500/50 text-blue-400 hover:bg-blue-900/30"
                            : "bg-emerald-900/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30"
                        }
          `}
                >
                    {isPreview ? (
                        <>
                            <Edit className="w-4 h-4" /> Switch to Edit
                        </>
                    ) : (
                        <>
                            <Eye className="w-4 h-4" /> View as SME
                        </>
                    )}
                </button>
            </div>

            {isPreview && (
                <div className="bg-blue-900/10 border border-blue-500/30 p-4 mb-4">
                    <p className="text-xs text-blue-400">
                        👁️ <strong>SME Preview Mode:</strong> This is exactly what Subject Matter
                        Experts will see when reviewing this product.
                    </p>
                </div>
            )}

            {children(isPreview)}
        </div>
    );
}
