'use client';

import { useState } from 'react';
import { X, Save, AlertCircle, CheckCircle, Plus, Trash2, Image, Link as LinkIcon, FileText } from 'lucide-react';
import { updateProductDetails } from '@/app/actions/admin-actions';

interface ProductEditModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductEditModal({
    product,
    isOpen,
    onClose,
}: ProductEditModalProps) {
    // Basic Info
    const [title, setTitle] = useState(product.title || '');
    const [brand, setBrand] = useState(product.brand || '');
    const [slug, setSlug] = useState(product.slug || '');
    const [description, setDescription] = useState(product.description || '');
    const [tagline, setTagline] = useState(product.tagline || '');

    // Links
    const [buyUrl, setBuyUrl] = useState(product.buy_url || '');

    // Media
    // Assuming product_photos is an array of strings
    const [photos, setPhotos] = useState<string[]>(Array.isArray(product.product_photos) ? product.product_photos : []);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    // Details
    const [ingredients, setIngredients] = useState(product.ingredients || '');

    // Tech Docs (JSON or URL)
    // We'll treat it as a URL string for simplicity in this edit form if it's an object with url, or just string
    const getInitialTechDocs = () => {
        if (typeof product.tech_docs === 'string') return product.tech_docs;
        if (product.tech_docs?.url) return product.tech_docs.url;
        return '';
    };
    const [techDocs, setTechDocs] = useState(getInitialTechDocs());

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleAddPhoto = () => {
        if (newPhotoUrl) {
            setPhotos([...photos, newPhotoUrl]);
            setNewPhotoUrl('');
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await updateProductDetails(product.id, {
                title,
                brand,
                slug,
                description,
                buy_url: buyUrl,
                product_photos: photos,
                ingredients,
                tech_docs: techDocs ? JSON.stringify({ url: techDocs }) : undefined, // Wrap in JSON object if specific structure needed or just string
            });

            if (!result.success) {
                throw new Error(result.error);
            }

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save changes');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-bone-white/20 bg-forest-obsidian">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bone-white/20 bg-forest-obsidian/95 p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-400">
                            <Save size={20} />
                        </div>
                        <div>
                            <h2 className="font-mono text-xl font-bold text-bone-white">
                                Edit Product
                            </h2>
                            <p className="font-mono text-xs text-bone-white/60">
                                {product.id}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-bone-white/60 transition-colors hover:bg-bone-white/10 hover:text-bone-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70 border-b border-bone-white/10 pb-2">
                                Basic Information
                            </h3>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Brand</label>
                                <input
                                    type="text"
                                    value={brand}
                                    onChange={(e) => setBrand(e.target.value)}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Slug (URL Path)</label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Additional Info & Media */}
                        <div className="space-y-6">
                            <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70 border-b border-bone-white/10 pb-2">
                                Details & Media
                            </h3>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Ingredients</label>
                                <textarea
                                    value={ingredients}
                                    onChange={(e) => setIngredients(e.target.value)}
                                    rows={3}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Buy URL</label>
                                <div className="flex items-center gap-2 rounded border border-bone-white/20 bg-bone-white/5 p-2 focus-within:border-emerald-500">
                                    <LinkIcon size={14} className="text-bone-white/40" />
                                    <input
                                        type="text"
                                        value={buyUrl}
                                        onChange={(e) => setBuyUrl(e.target.value)}
                                        className="flex-1 bg-transparent font-mono text-sm text-bone-white focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block font-mono text-xs text-bone-white/60">Technical Docs URL</label>
                                <div className="flex items-center gap-2 rounded border border-bone-white/20 bg-bone-white/5 p-2 focus-within:border-emerald-500">
                                    <FileText size={14} className="text-bone-white/40" />
                                    <input
                                        type="text"
                                        value={techDocs}
                                        onChange={(e) => setTechDocs(e.target.value)}
                                        className="flex-1 bg-transparent font-mono text-sm text-bone-white focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            {/* Photos Manager */}
                            <div>
                                <label className="mb-2 block font-mono text-xs text-bone-white/60">Product Photos</label>
                                <div className="space-y-2">
                                    {photos.map((photo, idx) => (
                                        <div key={idx} className="flex items-center gap-2 overflow-hidden rounded border border-bone-white/10 bg-bone-white/5 p-1">
                                            <div className="h-10 w-10 flex-shrink-0 bg-bone-white/10">
                                                <img src={photo} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.src = "")} />
                                            </div>
                                            <span className="flex-1 truncate font-mono text-xs text-bone-white/70">{photo}</span>
                                            <button onClick={() => handleRemovePhoto(idx)} className="p-2 text-bone-white/40 hover:text-red-400">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newPhotoUrl}
                                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                                            placeholder="Image URL"
                                            className="flex-1 rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                                        />
                                        <button onClick={handleAddPhoto} className="rounded bg-bone-white/10 p-2 text-bone-white hover:bg-emerald-500/20 hover:text-emerald-400">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex items-center justify-end gap-3 border-t border-bone-white/10 pt-6">
                        {error && (
                            <span className="flex items-center gap-1 text-xs text-red-400 mr-auto">
                                <AlertCircle size={12} /> {error}
                            </span>
                        )}
                        {success && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400 mr-auto">
                                <CheckCircle size={12} /> Saved successfully!
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="rounded px-4 py-2 font-mono text-xs text-bone-white/60 hover:bg-bone-white/10 hover:text-bone-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded bg-emerald-500 px-6 py-2 font-mono text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
