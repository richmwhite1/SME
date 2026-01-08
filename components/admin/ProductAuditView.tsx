'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    X,
    Trash2,
    Save,
    AlertTriangle,
    CheckCircle,
    Video,
    FileText,
    ExternalLink,
    ChevronLeft,
    Plus,
    LayoutList,
    FlaskConical,
    Sparkles
} from 'lucide-react';
import { submitProductAudit, updateProductPhotos } from '@/app/actions/admin-approval-actions';
import CloudinaryUploadWidget from '@/components/wizard/CloudinaryUploadWidget';
import TechDocsManager, { TechDoc } from '@/components/admin/TechDocsManager';

interface ProductAuditViewProps {
    product: any;
}

export default function ProductAuditView({ product }: ProductAuditViewProps) {
    const router = useRouter();

    // State for editable fields
    const [photos, setPhotos] = useState<string[]>(Array.isArray(product.product_photos) ? product.product_photos : []);
    const [videoUrl, setVideoUrl] = useState(product.video_url || product.youtube_link || '');
    const [blurb, setBlurb] = useState(product.company_blurb || '');

    // NEW: Core product fields
    const [productName, setProductName] = useState(product.name || product.title || '');
    const [brand, setBrand] = useState(product.brand || '');
    const [category, setCategory] = useState(product.category || '');
    const [thirdPartyLabLink, setThirdPartyLabLink] = useState(product.third_party_lab_link || '');

    // Audit Fields
    const [techDocs, setTechDocs] = useState<TechDoc[]>(Array.isArray(product.tech_docs) ? product.tech_docs : (product.tech_docs?.url ? [{ name: 'Legacy Doc', url: product.tech_docs.url, type: 'url' }] : []));
    const [targetAudience, setTargetAudience] = useState(product.target_audience || '');
    const [coreValueProp, setCoreValueProp] = useState(product.core_value_proposition || '');
    const [smeAccessNote, setSmeAccessNote] = useState(product.sme_access_note || '');

    // Parity Fields (JSON arrays)
    const [activeIngredients, setActiveIngredients] = useState<any[]>(Array.isArray(product.active_ingredients) ? product.active_ingredients : []);
    const [excipients, setExcipients] = useState<string[]>(Array.isArray(product.excipients) ? product.excipients : []);
    const [benefits, setBenefits] = useState<any[]>(Array.isArray(product.benefits) ? product.benefits : []);

    // Specs
    const initialSpecs = typeof product.technical_specs === 'string'
        ? JSON.parse(product.technical_specs)
        : product.technical_specs || {};
    const [technicalSpecs, setTechnicalSpecs] = useState<Record<string, string>>(initialSpecs);
    const [newSpecKey, setNewSpecKey] = useState('');
    const [newSpecValue, setNewSpecValue] = useState('');

    const handleAddSpec = () => {
        if (newSpecKey && newSpecValue) {
            setTechnicalSpecs(prev => ({ ...prev, [newSpecKey]: newSpecValue }));
            setNewSpecKey('');
            setNewSpecValue('');
        }
    };

    const handleRemoveSpec = (key: string) => {
        const newSpecs = { ...technicalSpecs };
        delete newSpecs[key];
        setTechnicalSpecs(newSpecs);
    };

    // State for signals
    const initialSignals = product.sme_signals || {};
    const [signals, setSignals] = useState(initialSignals);

    const handleToggleSignal = (key: string) => {
        setSignals((prev: any) => ({ ...prev, [key]: { verified: true, evidence: '' } }));
    };

    const handleRemoveSignal = (key: string) => {
        setSignals((prev: any) => {
            const newState = { ...prev };
            delete newState[key];
            return newState;
        });
    };

    // State for decision
    const [adminStatus, setAdminStatus] = useState<'approved' | 'rejected' | 'pending_review'>(
        product.admin_status || 'pending_review'
    );
    const [certificationTier, setCertificationTier] = useState<'None' | 'Unverified' | 'Verified' | 'SME Certified'>(
        (['Bronze', 'Silver', 'Gold'].includes(product.certification_tier)
            ? (product.certification_tier === 'Bronze' ? 'Unverified' : product.certification_tier === 'Silver' ? 'Verified' : 'SME Certified')
            : product.certification_tier) || 'None'
    );
    const [adminNotes, setAdminNotes] = useState(product.admin_notes || '');

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isUpdatingPhotos, setIsUpdatingPhotos] = useState(false);

    // Handlers
    const handleRemovePhoto = async (index: number) => {
        const updatedPhotos = photos.filter((_, i) => i !== index);
        setPhotos(updatedPhotos);

        // Immediate DB Update
        setIsUpdatingPhotos(true);
        try {
            await updateProductPhotos(product.id, updatedPhotos);
        } catch (e) {
            console.error("Failed to auto-save photo deletion", e);
        } finally {
            setIsUpdatingPhotos(false);
        }
    };

    const handlePhotoUpload = async (url: string) => {
        const updatedPhotos = [...photos, url];
        setPhotos(updatedPhotos);

        // Immediate DB Update
        setIsUpdatingPhotos(true);
        try {
            await updateProductPhotos(product.id, updatedPhotos);
        } catch (e) {
            console.error("Failed to auto-save photo upload", e);
        } finally {
            setIsUpdatingPhotos(false);
        }
    };


    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await submitProductAudit(product.id, {
                // Core product fields
                name: productName,
                title: productName,
                brand: brand,
                category: category,
                third_party_lab_link: thirdPartyLabLink,
                // Existing fields
                admin_status: adminStatus,
                certification_tier: certificationTier,
                admin_notes: adminNotes,
                product_photos: photos,
                video_url: videoUrl,
                company_blurb: blurb,
                sme_signals: signals,
                // Audit updates
                tech_docs: techDocs,
                target_audience: targetAudience,
                core_value_proposition: coreValueProp,
                technical_specs: technicalSpecs,
                sme_access_note: smeAccessNote,
                // Parity Fields
                active_ingredients: activeIngredients,
                excipients: excipients,
                benefits: benefits
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/dashboard');
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit audit');
        } finally {
            setIsSubmitting(false);
        }
    };

    // List Editors
    const removeListItem = (setter: any, list: any[], index: number) => {
        const newList = list.filter((_, i) => i !== index);
        setter(newList);
    };

    // Active Ingredients Editor
    const [newIngredient, setNewIngredient] = useState({ name: '', dosage: '' });
    const addIngredient = () => {
        if (newIngredient.name) {
            setActiveIngredients([...activeIngredients, newIngredient]);
            setNewIngredient({ name: '', dosage: '' });
        }
    };

    // Excipients Editor
    const [newExcipient, setNewExcipient] = useState('');
    const addExcipient = () => {
        if (newExcipient) {
            setExcipients([...excipients, newExcipient]);
            setNewExcipient('');
        }
    };

    // Benefits Editor
    const [newBenefit, setNewBenefit] = useState({ title: '', type: 'functional', citation: '' });
    const addBenefit = () => {
        if (newBenefit.title) {
            setBenefits([...benefits, { ...newBenefit, source: 'admin', is_verified: true }]);
            setNewBenefit({ title: '', type: 'functional', citation: '' });
        }
    };


    return (
        <div className="min-h-screen bg-[#0a0a0a] pb-20 text-[#e5e5e5]">
            {/* Top Bar */}
            <div className="sticky top-0 z-10 border-b border-bone-white/10 bg-[#0a0a0a]/95 backdrop-blur-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="rounded-full p-2 text-bone-white/60 hover:bg-bone-white/10 hover:text-bone-white"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="font-mono text-xl font-bold text-bone-white">
                                Product Audit: {product.product_name || product.name || product.title}
                            </h1>
                            <p className="font-mono text-sm text-bone-white/60">
                                {product.brand} • submitted on {new Date(product.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {success && (
                            <span className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-400">
                                <CheckCircle className="h-4 w-4" />
                                Saved Successfully
                            </span>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || success}
                            className="flex items-center gap-2 rounded bg-emerald-500 px-6 py-2 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Saving...' : 'Submit Decision'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto mt-8 grid max-w-7xl gap-8 px-6 lg:grid-cols-12">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-8 space-y-8">

                    {/* 1. Editable Media Section */}
                    <section className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-6">
                        <h2 className="mb-6 flex items-center gap-2 font-mono text-lg font-bold text-bone-white">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-xs text-emerald-400">1</span>
                            Media Audit
                        </h2>

                        {/* Photos */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <label className="block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    Product Photos ({photos.length})
                                </label>
                                <CloudinaryUploadWidget
                                    onUpload={handlePhotoUpload}
                                    maxPhotos={10}
                                    currentCount={photos.length}
                                />
                            </div>

                            {photos.length === 0 ? (
                                <div className="rounded border border-dashed border-bone-white/20 p-8 text-center font-mono text-sm text-bone-white/40">
                                    No photos uploaded.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {photos.map((url, index) => (
                                        <div key={index} className="group relative aspect-square overflow-hidden rounded border border-bone-white/10 bg-black">
                                            <Image
                                                src={url}
                                                alt={`Product photo ${index + 1}`}
                                                fill
                                                className="object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemovePhoto(index)}
                                                className="absolute right-1 top-1 rounded bg-black/60 p-1.5 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-red-500 group-hover:opacity-100"
                                                title="Remove Photo"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Video URL */}
                        <div>
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                YouTube / Video URL
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bone-white/40" />
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://youtube.com/..."
                                        className="w-full rounded border border-bone-white/20 bg-black/40 py-2.5 pl-10 pr-4 font-mono text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Content & Parity Fields */}
                    <section className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-6">
                        <h2 className="mb-6 flex items-center gap-2 font-mono text-lg font-bold text-bone-white">
                            <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-xs text-emerald-400">2</span>
                            Content & Formulation
                        </h2>

                        {/* Product Name */}
                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Product Name
                            </label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Brand */}
                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Brand
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* Category */}
                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm text-bone-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value="">Select Category...</option>
                                <option value="Survivalist">Survivalist</option>
                                <option value="Detox">Detox</option>
                                <option value="Brain Fog">Brain Fog</option>
                                <option value="Vitality">Vitality</option>
                                <option value="Sleep">Sleep</option>
                                <option value="Gut Health">Gut Health</option>
                                <option value="Hormones">Hormones</option>
                                <option value="Performance">Performance</option>
                                <option value="Weight Loss">Weight Loss</option>
                                <option value="Recovery">Recovery</option>
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Company Blurb
                            </label>
                            <textarea
                                value={blurb}
                                onChange={(e) => setBlurb(e.target.value)}
                                rows={6}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm leading-relaxed text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Target Audience
                            </label>
                            <textarea
                                value={targetAudience}
                                onChange={(e) => setTargetAudience(e.target.value)}
                                rows={2}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm leading-relaxed text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Core Value Proposition
                            </label>
                            <textarea
                                value={coreValueProp}
                                onChange={(e) => setCoreValueProp(e.target.value)}
                                rows={2}
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-4 font-sans text-sm leading-relaxed text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>

                        {/* ACTIVE INGREDIENTS */}
                        <div className="mb-6 border-t border-bone-white/10 pt-6">
                            <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70 flex items-center gap-2">
                                <FlaskConical className="w-4 h-4" /> Active Ingredients
                            </h3>
                            <div className="space-y-2 mb-3">
                                {activeIngredients.map((ing, i) => (
                                    <div key={i} className="flex justify-between items-center bg-bone-white/5 p-2 rounded text-sm text-bone-white">
                                        <span>{ing.name} <span className="text-bone-white/50">{ing.dosage}</span></span>
                                        <button onClick={() => removeListItem(setActiveIngredients, activeIngredients, i)} className="text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={newIngredient.name} onChange={e => setNewIngredient({ ...newIngredient, name: e.target.value })} placeholder="Name" className="flex-1 bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white" />
                                <input value={newIngredient.dosage} onChange={e => setNewIngredient({ ...newIngredient, dosage: e.target.value })} placeholder="Dosage" className="w-24 bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white" />
                                <button onClick={addIngredient} className="bg-emerald-500/20 text-emerald-400 p-2 rounded"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* EXCIPIENTS */}
                        <div className="mb-6 border-t border-bone-white/10 pt-6">
                            <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70 flex items-center gap-2">
                                <LayoutList className="w-4 h-4" /> Excipients (Other Ingredients)
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {excipients.map((ex, i) => (
                                    <div key={i} className="bg-bone-white/10 px-2 py-1 rounded text-xs text-bone-white flex items-center gap-2">
                                        {ex}
                                        <button onClick={() => removeListItem(setExcipients, excipients, i)} className="text-red-400/50 hover:text-red-400"><X className="w-3 h-3" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={newExcipient} onChange={e => setNewExcipient(e.target.value)} placeholder="Excipient Name" className="flex-1 bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white" />
                                <button onClick={addExcipient} className="bg-emerald-500/20 text-emerald-400 p-2 rounded"><Plus className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* BENEFITS */}
                        <div className="mb-6 border-t border-bone-white/10 pt-6">
                            <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Benefits & Claims
                            </h3>
                            <div className="space-y-2 mb-3">
                                {benefits.map((ben, i) => (
                                    <div key={i} className="bg-bone-white/5 p-2 rounded text-sm text-bone-white flex justify-between items-start">
                                        <div>
                                            <div className="font-medium">{ben.benefit_title || ben.title} <span className="text-xs text-emerald-500 bg-emerald-500/10 px-1 rounded">{ben.benefit_type || ben.type}</span></div>
                                            {ben.citation_url && <a href={ben.citation_url} target="_blank" className="text-xs text-blue-400 hover:underline">{ben.citation_url}</a>}
                                        </div>
                                        <button onClick={() => removeListItem(setBenefits, benefits, i)} className="text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="grid gap-2">
                                <input value={newBenefit.title} onChange={e => setNewBenefit({ ...newBenefit, title: e.target.value })} placeholder="Benefit Title" className="w-full bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white" />
                                <div className="flex gap-2">
                                    <select value={newBenefit.type} onChange={e => setNewBenefit({ ...newBenefit, type: e.target.value })} className="bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white">
                                        <option value="functional">Functional</option>
                                        <option value="cognitive">Cognitive</option>
                                        <option value="physical">Physical</option>
                                    </select>
                                    <input value={newBenefit.citation} onChange={e => setNewBenefit({ ...newBenefit, citation: e.target.value })} placeholder="Citation URL (Optional)" className="flex-1 bg-black/40 p-2 text-xs border border-bone-white/20 rounded text-white" />
                                    <button onClick={addBenefit} className="bg-emerald-500/20 text-emerald-400 p-2 rounded"><Plus className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </div>

                        {/* THIRD-PARTY LAB LINK */}
                        <div className="mb-6 border-t border-bone-white/10 pt-6">
                            <label className="mb-2 block font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                Third-Party Lab Testing Link
                            </label>
                            <input
                                type="url"
                                value={thirdPartyLabLink}
                                onChange={(e) => setThirdPartyLabLink(e.target.value)}
                                placeholder="https://example.com/lab-results.pdf"
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-3 font-sans text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                            <p className="mt-1 text-xs text-bone-white/50">Link to independent laboratory testing results (COA, purity tests, etc.)</p>
                        </div>

                    </section>

                    {/* 3. Truth Signal Management */}
                    <section className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 font-mono text-lg font-bold text-bone-white">
                                <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/20 text-xs text-emerald-400">3</span>
                                Truth Signal Verification
                            </h2>
                            <div className="flex gap-4 font-mono text-sm">
                                <span className="text-emerald-400">Active: <b>{Object.keys(signals).length}</b></span>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {['third_party_lab_verified', 'purity_tested', 'source_transparency', 'potency_verified', 'excipient_audit', 'operational_legitimacy', 'esoteric', 'safe', 'warning'].map((key) => {
                                const signalData = signals[key as keyof typeof signals] as any;
                                const isVerified = !!signalData;
                                const evidence = signalData?.evidence;

                                return (
                                    <div
                                        key={key}
                                        className={`flex flex-col gap-2 rounded border p-3 transition-colors ${isVerified
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-bone-white/10 bg-bone-white/5 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-bone-white/10 text-bone-white/30'
                                                    }`}>
                                                    {isVerified ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                                                </div>
                                                <span className={`font-mono text-sm font-medium ${isVerified ? 'text-bone-white' : 'text-bone-white/50'
                                                    }`}>
                                                    {key.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </span>
                                            </div>

                                            {isVerified ? (
                                                <button
                                                    onClick={() => handleRemoveSignal(key)}
                                                    className="rounded p-1.5 text-bone-white/40 hover:bg-red-500/20 hover:text-red-400"
                                                    title="Remove Signal"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleToggleSignal(key)}
                                                    className="rounded border border-bone-white/10 px-2 py-1 text-xs text-bone-white/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                                                >
                                                    Add
                                                </button>
                                            )}
                                        </div>

                                        {/* Evidence Display */}
                                        {isVerified && (
                                            <div className="mt-2 pl-11">
                                                {evidence ? (
                                                    evidence.endsWith('.pdf') ? (
                                                        <a
                                                            href={evidence}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 rounded border border-emerald-500/30 bg-black/40 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            View Evidence (PDF)
                                                        </a>
                                                    ) : (
                                                        <a
                                                            href={evidence}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative block h-16 w-full overflow-hidden rounded border border-emerald-500/30 bg-black/40"
                                                        >
                                                            <Image
                                                                src={evidence}
                                                                alt="Evidence"
                                                                fill
                                                                className="object-cover opacity-80 transition-opacity group-hover:opacity-100"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <span className="text-xs font-bold uppercase text-white">View</span>
                                                            </div>
                                                        </a>
                                                    )
                                                ) : (
                                                    <div className="flex items-center gap-2 text-xs italic text-yellow-500/70">
                                                        <AlertTriangle className="h-3 w-3" />
                                                        No evidence provided
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* Right Sidebar - Decision & Metadata */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Decision Card */}
                    <div className="sticky top-24 rounded-lg border border-emerald-500/30 bg-[#0a0a0a] p-6 shadow-xl shadow-black/50">
                        <h2 className="mb-6 font-mono text-lg font-bold text-emerald-400">
                            Decision Panel
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                    Approval Status
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors ${adminStatus === 'approved'
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-bone-white/10 bg-black/20 hover:bg-bone-white/5'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="approved"
                                            checked={adminStatus === 'approved'}
                                            onChange={() => setAdminStatus('approved')}
                                            className="text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="font-mono text-sm font-bold text-bone-white">Approve</span>
                                    </label>

                                    <label className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors ${adminStatus === 'rejected'
                                        ? 'border-red-500 bg-red-500/10'
                                        : 'border-bone-white/10 bg-black/20 hover:bg-bone-white/5'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="rejected"
                                            checked={adminStatus === 'rejected'}
                                            onChange={() => setAdminStatus('rejected')}
                                            className="text-red-500 focus:ring-red-500"
                                        />
                                        <span className="font-mono text-sm font-bold text-bone-white">Reject</span>
                                    </label>

                                    <label className={`flex cursor-pointer items-center gap-3 rounded border p-3 transition-colors ${adminStatus === 'pending_review'
                                        ? 'border-yellow-500 bg-yellow-500/10'
                                        : 'border-bone-white/10 bg-black/20 hover:bg-bone-white/5'
                                        }`}>
                                        <input
                                            type="radio"
                                            name="status"
                                            value="pending_review"
                                            checked={adminStatus === 'pending_review'}
                                            onChange={() => setAdminStatus('pending_review')}
                                            className="text-yellow-500 focus:ring-yellow-500"
                                        />
                                        <span className="font-mono text-sm font-bold text-bone-white">Pending</span>
                                    </label>
                                </div>
                            </div>

                            {adminStatus === 'approved' && (
                                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                        Certification Tier
                                    </label>
                                    <select
                                        value={certificationTier}
                                        onChange={(e) => setCertificationTier(e.target.value as any)}
                                        className="w-full rounded border border-bone-white/20 bg-black/40 p-3 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="None">Select Tier...</option>
                                        <option value="Unverified">Unverified</option>
                                        <option value="Verified">Verified</option>
                                        <option value="SME Certified">SME Certified</option>
                                    </select>
                                </div>
                            )}

                        </div>

                        {/* SME Access Notes */}
                        <div className="mt-6">
                            <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-yellow-500/80">
                                SME Access Notes
                            </label>
                            <textarea
                                value={smeAccessNote}
                                onChange={(e) => setSmeAccessNote(e.target.value)}
                                rows={3}
                                placeholder="Instructions for the SME..."
                                className="w-full rounded border border-yellow-500/20 bg-yellow-500/5 p-3 font-mono text-sm text-bone-white placeholder-bone-white/30 focus:border-yellow-500 focus:outline-none"
                            />
                        </div>

                        <div className="mt-4">
                            <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                Internal Notes
                            </label>
                            <textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={4}
                                placeholder="Reason for decision..."
                                className="w-full rounded border border-bone-white/20 bg-black/40 p-3 font-mono text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 rounded border border-red-500/50 bg-red-500/10 p-3 text-center font-mono text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || success}
                            className="mt-6 w-full rounded bg-emerald-500 py-4 font-mono text-sm font-bold uppercase tracking-wider text-black transition-colors hover:bg-emerald-400 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : success ? 'Saved!' : 'Submit Decision'}
                        </button>
                    </div>
                </div>

                {/* Documents Card */}
                <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-6 lg:col-span-12">
                    <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                        Supporting Docs & Technical Specs
                    </h3>

                    {/* Tech Docs Manager */}
                    <TechDocsManager
                        docs={techDocs}
                        onUpdate={setTechDocs}
                        maxDocs={10}
                    />

                    {/* Technical Specs Key-Value Editor */}
                    <div className="pt-4 border-t border-bone-white/10 mt-6">
                        <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                            Technical Specs (Key/Value)
                        </h3>
                        <div className="space-y-2 mb-3">
                            {Object.entries(technicalSpecs).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between rounded bg-bone-white/5 p-2 text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-bone-white/80">{key}</span>
                                        <span className="text-bone-white/60">{String(value)}</span>
                                    </div>
                                    <button onClick={() => handleRemoveSpec(key)} className="text-bone-white/40 hover:text-red-400">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSpecKey}
                                onChange={(e) => setNewSpecKey(e.target.value)}
                                placeholder="Key"
                                className="flex-1 rounded border border-bone-white/20 bg-black/40 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                            />
                            <input
                                type="text"
                                value={newSpecValue}
                                onChange={(e) => setNewSpecValue(e.target.value)}
                                placeholder="Value"
                                className="flex-1 rounded border border-bone-white/20 bg-black/40 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                            />
                            <button onClick={handleAddSpec} className="rounded bg-bone-white/10 p-2 text-bone-white hover:bg-emerald-500/20 hover:text-emerald-400">
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
