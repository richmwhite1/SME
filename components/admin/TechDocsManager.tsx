"use client";

import { useState } from "react";
import { X, FileText, Plus, Link as LinkIcon, Download } from "lucide-react";
import CloudinaryUploadWidget from "@/components/wizard/CloudinaryUploadWidget";

export interface TechDoc {
    name: string;
    url: string;
    type: 'file' | 'url';
}

interface TechDocsManagerProps {
    docs: TechDoc[];
    onUpdate: (docs: TechDoc[]) => void;
    maxDocs?: number;
}

export default function TechDocsManager({
    docs,
    onUpdate,
    maxDocs = 10,
}: TechDocsManagerProps) {
    const [localDocs, setLocalDocs] = useState<TechDoc[]>(docs);
    const [isAddingUrl, setIsAddingUrl] = useState(false);
    const [newUrl, setNewUrl] = useState("");
    const [newName, setNewName] = useState("");

    const handleUpload = (url: string) => {
        if (localDocs.length < maxDocs) {
            // Infer name from URL filename or timestamp
            const name = url.split('/').pop() || `Doc ${new Date().toLocaleDateString()}`;
            const newDoc: TechDoc = { name, url, type: 'file' };
            const updated = [...localDocs, newDoc];
            setLocalDocs(updated);
            onUpdate(updated);
        }
    };

    const handleAddUrl = () => {
        if (newUrl && newName && localDocs.length < maxDocs) {
            const newDoc: TechDoc = { name: newName, url: newUrl, type: 'url' };
            const updated = [...localDocs, newDoc];
            setLocalDocs(updated);
            onUpdate(updated);
            setNewUrl("");
            setNewName("");
            setIsAddingUrl(false);
        }
    };

    const handleDelete = (index: number) => {
        const updated = localDocs.filter((_, i) => i !== index);
        setLocalDocs(updated);
        onUpdate(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm uppercase tracking-wider text-emerald-500">
                    Technical Docs ({localDocs.length}/{maxDocs})
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAddingUrl(!isAddingUrl)}
                        className="flex items-center gap-2 px-3 py-2 text-xs border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded"
                    >
                        <LinkIcon className="w-3 h-3" />
                        Add URL
                    </button>
                    <CloudinaryUploadWidget
                        onUpload={handleUpload}
                        maxPhotos={maxDocs}
                        currentCount={localDocs.length}
                    />
                </div>
            </div>

            {isAddingUrl && (
                <div className="p-3 bg-bone-white/5 border border-bone-white/10 rounded flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-xs text-bone-white/50 block mb-1">Name</label>
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Clinical Study 2024"
                            className="w-full bg-black/40 border border-bone-white/20 rounded p-2 text-xs text-bone-white"
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="text-xs text-bone-white/50 block mb-1">URL</label>
                        <input
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-black/40 border border-bone-white/20 rounded p-2 text-xs text-bone-white"
                        />
                    </div>
                    <button
                        onClick={handleAddUrl}
                        disabled={!newUrl || !newName}
                        className="p-2 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="space-y-2">
                {localDocs.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-bone-white/5 border border-bone-white/10 rounded">
                        <div className="flex items-center gap-3">
                            {doc.type === 'file' ? <FileText className="w-4 h-4 text-emerald-400" /> : <LinkIcon className="w-4 h-4 text-blue-400" />}
                            <div className="flex flex-col">
                                <span className="text-sm text-bone-white font-medium">{doc.name}</span>
                                <a href={doc.url} target="_blank" rel="noopener" className="text-xs text-bone-white/50 hover:text-emerald-400 truncate max-w-[200px]">
                                    {doc.url}
                                </a>
                            </div>
                        </div>
                        <button
                            onClick={() => handleDelete(index)}
                            className="text-bone-white/30 hover:text-red-400 p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            {localDocs.length === 0 && (
                <div className="text-center p-4 border border-dashed border-bone-white/10 rounded text-xs text-bone-white/30">
                    No documents attached
                </div>
            )}
        </div>
    );
}
