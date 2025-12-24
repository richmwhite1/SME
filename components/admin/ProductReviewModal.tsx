'use client';

import { useState } from 'react';
import { X, Video, FileText, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import ProductRadarChart from '@/components/product/ProductRadarChart';
import { updateProductApproval } from '@/app/actions/admin-approval-actions';

interface ProductReviewModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductReviewModal({
    product,
    isOpen,
    onClose,
}: ProductReviewModalProps) {
    const [adminStatus, setAdminStatus] = useState<'approved' | 'rejected' | 'pending_review'>(
        product.admin_status || 'pending_review'
    );
    const [certificationTier, setCertificationTier] = useState<'None' | 'Bronze' | 'Silver' | 'Gold'>(
        product.certification_tier || 'None'
    );
    const [adminNotes, setAdminNotes] = useState(product.admin_notes || '');

    // Audit Fields State
    const [techDocsUrl, setTechDocsUrl] = useState(product.tech_docs?.url || '');
    const [targetAudience, setTargetAudience] = useState(product.target_audience || '');
    const [coreValueProp, setCoreValueProp] = useState(product.core_value_proposition || '');
    const [smeAccessNote, setSmeAccessNote] = useState(product.sme_access_note || '');
    const [videoUrl, setVideoUrl] = useState(product.video_url || '');

    // Parse technical specs if string or use as is
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

    // Internal state for Truth Signals
    const [signals, setSignals] = useState({
        third_party_lab_verified: product.third_party_lab_verified || false,
        purity_tested: product.purity_tested || false,
        source_transparency: product.source_transparency || false,
        potency_verified: product.potency_verified || false,
        excipient_audit: product.excipient_audit || false,
        operational_legitimacy: product.operational_legitimacy || false,
    });

    const handleRemoveSignal = (key: keyof typeof signals) => {
        setSignals(prev => ({ ...prev, [key]: false }));
    };
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            await updateProductApproval(product.id, {
                admin_status: adminStatus,
                certification_tier: certificationTier,
                admin_notes: adminNotes,
                verification_flags: signals,
                // Audit updates
                tech_docs: { url: techDocsUrl },
                target_audience: targetAudience,
                core_value_proposition: coreValueProp,
                technical_specs: technicalSpecs,
                sme_access_note: smeAccessNote,
                video_url: videoUrl,
            });

            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const radarData = product.radar_data || {
        scientific: 0,
        alternative: 0,
        esoteric: 0,
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-bone-white/20 bg-forest-obsidian">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bone-white/20 bg-forest-obsidian/95 p-6 backdrop-blur-sm">
                    <div>
                        <h2 className="font-mono text-2xl font-bold text-bone-white">
                            {product.product_name || product.title}
                        </h2>
                        <p className="mt-1 font-mono text-sm text-bone-white/60">
                            {product.brand || 'No brand specified'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-bone-white/60 transition-colors hover:bg-bone-white/10 hover:text-bone-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Founder Video */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <Video className="h-5 w-5 text-bone-white/70" />
                                    <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                        Founder Video
                                    </h3>
                                </div>
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className="mb-3 w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                                />
                                {videoUrl && (
                                    <div className="aspect-video w-full overflow-hidden rounded">
                                        <iframe
                                            src={videoUrl.replace('watch?v=', 'embed/')}
                                            className="h-full w-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Core Value Proposition */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    Core Value Proposition
                                </h3>
                                <textarea
                                    value={coreValueProp}
                                    onChange={(e) => setCoreValueProp(e.target.value)}
                                    rows={4}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="Describe the core value..."
                                />
                            </div>

                            {/* Target Audience */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    Target Audience
                                </h3>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none"
                                    placeholder="e.g. Biohackers, Athletes"
                                />
                            </div>

                            {/* SME Radar Chart */}
                            <div>
                                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    SME Radar Chart
                                </h3>
                                <ProductRadarChart data={radarData} />
                            </div>

                            {/* Truth Signals */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    Truth Signals
                                </h3>
                                <div className="space-y-2">
                                    <SignalItem
                                        label="Third-Party Lab Verified"
                                        verified={signals.third_party_lab_verified}
                                        onRemove={() => handleRemoveSignal('third_party_lab_verified')}
                                    />
                                    <SignalItem
                                        label="Purity Tested"
                                        verified={signals.purity_tested}
                                        onRemove={() => handleRemoveSignal('purity_tested')}
                                    />
                                    <SignalItem
                                        label="Source Transparency"
                                        verified={signals.source_transparency}
                                        onRemove={() => handleRemoveSignal('source_transparency')}
                                    />
                                    <SignalItem
                                        label="Potency Verified"
                                        verified={signals.potency_verified}
                                        onRemove={() => handleRemoveSignal('potency_verified')}
                                    />
                                    <SignalItem
                                        label="Excipient Audit"
                                        verified={signals.excipient_audit}
                                        onRemove={() => handleRemoveSignal('excipient_audit')}
                                    />
                                    <SignalItem
                                        label="Operational Legitimacy"
                                        verified={signals.operational_legitimacy}
                                        onRemove={() => handleRemoveSignal('operational_legitimacy')}
                                    />
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-bone-white/10 pt-3 font-mono text-sm">
                                    <span className="text-bone-white/60">Total Signals:</span>
                                    <span className="font-bold text-emerald-400">
                                        {Object.values(signals).filter(Boolean).length}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between font-mono text-sm">
                                    <span className="text-bone-white/60">Red Flags:</span>
                                    {/* Red flags logic: in this context, just showing inverse of total might be misleading if original logic was complex, 
                                        but sticking to simple inverse for now or keeping static if complex. 
                                        Original was `product.red_flags`. Since we are editing locally, we should probably update this count too.
                                        Assuming red_flags count = number of false signals.
                                    */}
                                    <span className="font-bold text-red-400">
                                        {Object.values(signals).filter(v => !v).length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Certification Vault & Tech Docs */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-bone-white/70" />
                                    <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                        Docs & Certs
                                    </h3>
                                </div>

                                {/* Technical Documentation Link */}
                                <div className="mb-4">
                                    <label className="mb-1 block font-mono text-xs uppercase text-bone-white/50">Technical Doc URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={techDocsUrl}
                                            onChange={(e) => setTechDocsUrl(e.target.value)}
                                            className="flex-1 rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                                            placeholder="https://..."
                                        />
                                        {techDocsUrl && (
                                            <a
                                                href={techDocsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-bold uppercase text-emerald-400 hover:bg-emerald-500/20"
                                            >
                                                Open
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {product.coa_url ? (
                                    <a
                                        href={product.coa_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mb-2 block rounded border border-bone-white/20 bg-bone-white/5 p-3 font-mono text-sm text-bone-white transition-colors hover:bg-bone-white/10"
                                    >
                                        📄 Certificate of Analysis (COA)
                                    </a>
                                ) : (
                                    <p className="mb-2 font-mono text-sm text-bone-white/40">No COA uploaded</p>
                                )}
                                {product.citation_url && (
                                    <a
                                        href={product.citation_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block rounded border border-bone-white/20 bg-bone-white/5 p-3 font-mono text-sm text-bone-white transition-colors hover:bg-bone-white/10"
                                    >
                                        📚 Citation/Reference
                                    </a>
                                )}
                            </div>

                            {/* Technical Specs Editor */}
                            <div className="rounded-lg border border-bone-white/10 bg-bone-white/5 p-4">
                                <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-bone-white/70">
                                    Technical Specs
                                </h3>
                                <div className="space-y-2 mb-3">
                                    {Object.entries(technicalSpecs).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between rounded bg-bone-white/5 p-2 text-xs">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-bone-white/80">{key}</span>
                                                <span className="text-bone-white/60">{String(value)}</span>
                                            </div>
                                            <button onClick={() => handleRemoveSpec(key)} className="text-bone-white/40 hover:text-red-400">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSpecKey}
                                        onChange={(e) => setNewSpecKey(e.target.value)}
                                        placeholder="Key (e.g. Material)"
                                        className="flex-1 rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        value={newSpecValue}
                                        onChange={(e) => setNewSpecValue(e.target.value)}
                                        placeholder="Value"
                                        className="flex-1 rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-xs text-bone-white focus:border-emerald-500 focus:outline-none"
                                    />
                                    <button onClick={handleAddSpec} className="rounded bg-bone-white/10 p-2 text-bone-white hover:bg-emerald-500/20 hover:text-emerald-400">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* SME Access Notes */}
                            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                                <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wider text-yellow-500/80">
                                    SME Access Notes
                                </h3>
                                <textarea
                                    value={smeAccessNote}
                                    onChange={(e) => setSmeAccessNote(e.target.value)}
                                    rows={3}
                                    className="w-full rounded border border-yellow-500/20 bg-transparent p-2 font-mono text-sm text-bone-white focus:border-yellow-500 focus:outline-none"
                                    placeholder="Instructions for the SME..."
                                />
                            </div>

                            {/* Decision Panel */}
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                                <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-emerald-400">
                                    Admin Decision Panel
                                </h3>

                                {/* Admin Status Dropdown */}
                                <div className="mb-4">
                                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                        Admin Status
                                    </label>
                                    <select
                                        value={adminStatus}
                                        onChange={(e) => setAdminStatus(e.target.value as any)}
                                        className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    >
                                        <option value="pending_review">Pending Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>

                                {/* Certification Tier Radio Buttons */}
                                <div className="mb-4">
                                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                        Certification Tier
                                    </label>
                                    <div className="space-y-2">
                                        {['None', 'Bronze', 'Silver', 'Gold'].map((tier) => (
                                            <label
                                                key={tier}
                                                className="flex cursor-pointer items-center gap-2 rounded border border-bone-white/10 bg-bone-white/5 p-2 transition-colors hover:bg-bone-white/10"
                                            >
                                                <input
                                                    type="radio"
                                                    name="certification_tier"
                                                    value={tier}
                                                    checked={certificationTier === tier}
                                                    onChange={(e) => setCertificationTier(e.target.value as any)}
                                                    className="h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                                                />
                                                <span className="font-mono text-sm text-bone-white">{tier}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Admin Notes */}
                                <div className="mb-4">
                                    <label className="mb-2 block font-mono text-xs uppercase tracking-wider text-bone-white/70">
                                        Internal Admin Notes
                                    </label>
                                    <textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        rows={4}
                                        placeholder="Add internal notes about this decision..."
                                        className="w-full rounded border border-bone-white/20 bg-bone-white/5 p-2 font-mono text-sm text-bone-white placeholder-bone-white/30 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Error/Success Messages */}
                                {error && (
                                    <div className="mb-4 flex items-center gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 font-mono text-sm text-red-400">
                                        <AlertCircle className="h-4 w-4" />
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-sm text-emerald-400">
                                        <CheckCircle className="h-4 w-4" />
                                        Decision saved successfully!
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || success}
                                    className="w-full rounded bg-emerald-500 px-4 py-3 font-mono text-sm font-semibold uppercase tracking-wider text-black transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : success ? 'Saved!' : 'Submit Decision'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Trash2 } from 'lucide-react';

function SignalItem({ label, verified, onRemove }: { label: string; verified: boolean; onRemove: () => void }) {
    if (!verified) return null; // Don't show if already removed/false (User request: "remove that signal from the local selectedSignals state") -> Implies visual removal

    return (
        <div className="flex items-center justify-between rounded border border-bone-white/10 bg-bone-white/5 p-2 transition-colors hover:bg-bone-white/10 group">
            <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="font-mono text-xs text-bone-white/90">{label}</span>
            </div>
            <button
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 p-1 text-bone-white/40 hover:text-red-400 transition-all ml-2"
                title="Remove Signal"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}
