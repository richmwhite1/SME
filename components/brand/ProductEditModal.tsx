'use client';

import { useState } from 'react';
import { updateProductBrandFields, BrandProductUpdateData } from '@/app/actions/update-product-brand-fields';
import { X, Save, Image, Link as LinkIcon, FileText, AlertCircle, Plus, Trash2, CheckCircle } from 'lucide-react';

interface ProductEditModalProps {
    productId: string;
    productTitle: string;
    // We pass the full product object now or fallback to what we have
    initialData: Partial<BrandProductUpdateData>;
    isSubscriptionActive: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ProductEditModal({
    productId,
    productTitle,
    initialData,
    isSubscriptionActive,
    onClose,
    onSuccess,
}: ProductEditModalProps) {
    // Form State
    const [title, setTitle] = useState(initialData.title || productTitle);
    const [tagline, setTagline] = useState(initialData.tagline || '');
    const [description, setDescription] = useState(initialData.description || '');
    const [manufacturer, setManufacturer] = useState(initialData.manufacturer || '');
    const [price, setPrice] = useState(initialData.price || '');
    const [servingInfo, setServingInfo] = useState(initialData.serving_info || '');
    const [warnings, setWarnings] = useState(initialData.warnings || '');
    const [ingredients, setIngredients] = useState(initialData.ingredients || '');

    // Links
    const [buyUrl, setBuyUrl] = useState(initialData.buy_url || '');
    const [discountCode, setDiscountCode] = useState(initialData.discount_code || '');
    const [techDocsUrl, setTechDocsUrl] = useState(initialData.tech_docs_url || '');

    // Media
    const [photos, setPhotos] = useState<string[]>(initialData.product_photos || []);
    const [newPhotoUrl, setNewPhotoUrl] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleAddPhoto = () => {
        if (newPhotoUrl) {
            setPhotos([...photos, newPhotoUrl]);
            setNewPhotoUrl('');
        }
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await updateProductBrandFields({
                id: productId,
                title,
                tagline,
                description,
                manufacturer,
                price,
                serving_info: servingInfo,
                warnings,
                ingredients,
                buy_url: buyUrl,
                discount_code: discountCode,
                tech_docs_url: techDocsUrl,
                product_photos: photos,
            });

            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                setError(result.error || 'Failed to update product');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isSubscriptionActive) {
        return (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-[#111] border border-red-900/50 rounded-lg max-w-md w-full p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Subscription Required</h3>
                    <p className="text-gray-400 mb-6">You must have an active subscription to access the Enterprise Editor.</p>
                    <button onClick={onClose} className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200">Close</button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative h-[90vh] w-full max-w-5xl rounded-xl border border-[#333] bg-[#0a0a0a] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#333] bg-[#111]/50 p-6 backdrop-blur sticky top-0 z-10 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                            <Save size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                                Enterprise Editor
                            </h2>
                            <p className="font-mono text-xs text-emerald-500 font-semibold">
                                EDITING: {productTitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Create a Scrollable Form Container */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* COLUMN 1: Narrative & Details */}
                        <div className="space-y-8">

                            {/* Section: Identity */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 border-b border-[#333] pb-2">
                                    <FileText size={14} /> Product Identity
                                </h3>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Product Title</label>
                                    <input
                                        value={title} onChange={e => setTitle(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Tagline (Optional)</label>
                                    <input
                                        value={tagline} onChange={e => setTagline(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none"
                                        placeholder="e.g. The Ultimate Brain Fuel"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Description</label>
                                    <textarea
                                        value={description} onChange={e => setDescription(e.target.value)}
                                        rows={4}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Section: Commercial */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 border-b border-[#333] pb-2">
                                    <LinkIcon size={14} /> Commercial & Links
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Price</label>
                                        <input
                                            value={price} onChange={e => setPrice(e.target.value)}
                                            className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none"
                                            placeholder="$49.99"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-mono text-gray-400 mb-1">Discount Code</label>
                                        <input
                                            value={discountCode} onChange={e => setDiscountCode(e.target.value)}
                                            className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none uppercase font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Purchase URL (Direct)</label>
                                    <input
                                        value={buyUrl} onChange={e => setBuyUrl(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none font-mono text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* COLUMN 2: Specs & Media */}
                        <div className="space-y-8">

                            {/* Section: Technical Specs */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 border-b border-[#333] pb-2">
                                    <AlertCircle size={14} /> Safety & Specs
                                </h3>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Serving Info</label>
                                    <input
                                        value={servingInfo} onChange={e => setServingInfo(e.target.value)}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Warnings / Contraindications</label>
                                    <textarea
                                        value={warnings} onChange={e => setWarnings(e.target.value)}
                                        rows={2}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-mono text-gray-400 mb-1">Full Ingredients List</label>
                                    <textarea
                                        value={ingredients} onChange={e => setIngredients(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#111] border border-[#333] p-3 text-white rounded focus:border-emerald-500 outline-none resize-none font-mono text-xs"
                                    />
                                </div>
                            </div>

                            {/* Section: Media Gallery */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2 border-b border-[#333] pb-2">
                                    <Image size={14} /> Media Gallery
                                </h3>

                                <div className="space-y-3">
                                    {photos.map((photo, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-[#111] p-2 rounded border border-[#333]">
                                            <div className="w-10 h-10 bg-black rounded overflow-hidden">
                                                <img src={photo} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="flex-1 text-xs truncate font-mono text-gray-400">{photo}</span>
                                            <button type="button" onClick={() => handleRemovePhoto(idx)} className="p-2 text-gray-500 hover:text-red-400">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}

                                    <div className="flex gap-2">
                                        <input
                                            value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)}
                                            placeholder="https://image-url.com/photo.jpg"
                                            className="flex-1 bg-[#111] border border-[#333] p-2 text-xs text-white rounded focus:border-emerald-500 outline-none"
                                        />
                                        <button type="button" onClick={handleAddPhoto} className="px-3 bg-[#222] hover:bg-[#333] text-white rounded border border-[#333]">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">* Provide direct URLs to images hosted on your CDN or Shopify.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="border-t border-[#333] bg-[#111]/50 p-6 backdrop-blur flex items-center justify-between rounded-b-xl">
                    <div className="flex-1">
                        {error && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</p>}
                        {success && <p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle size={16} /> Changes saved successfully!</p>}
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button
                            form="product-form"
                            type="submit"
                            disabled={isLoading}
                            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded shadow-lg shadow-emerald-900/20 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                            {isLoading ? 'Saving...' : 'Save Updates'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
