"use client";

import { FileText, Beaker, Shield, ExternalLink, Download } from "lucide-react";

interface Document {
    type: 'coa' | 'lab_report' | 'certification' | 'technical';
    label: string;
    url: string;
}

interface VerificationDocumentsProps {
    coaUrl?: string | null;
    labReportUrl?: string | null;
    technicalDocsUrl?: string | null;
    certificationVaultUrls?: string[] | null;
}

export default function VerificationDocuments({
    coaUrl,
    labReportUrl,
    technicalDocsUrl,
    certificationVaultUrls
}: VerificationDocumentsProps) {
    // Build documents array
    const documents: Document[] = [];

    if (coaUrl) {
        documents.push({
            type: 'coa',
            label: 'Certificate of Analysis (COA)',
            url: coaUrl
        });
    }

    if (labReportUrl) {
        documents.push({
            type: 'lab_report',
            label: 'Third-Party Lab Report',
            url: labReportUrl
        });
    }

    if (technicalDocsUrl) {
        documents.push({
            type: 'technical',
            label: 'Technical Documentation',
            url: technicalDocsUrl
        });
    }

    // Add certification vault URLs
    if (certificationVaultUrls && certificationVaultUrls.length > 0) {
        certificationVaultUrls.forEach((url, index) => {
            documents.push({
                type: 'certification',
                label: `Certification Document ${index + 1}`,
                url
            });
        });
    }

    // Don't render if no documents
    if (documents.length === 0) return null;

    // Map document types to icons
    const getIcon = (type: Document['type']) => {
        switch (type) {
            case 'coa':
                return Beaker;
            case 'lab_report':
                return FileText;
            case 'certification':
                return Shield;
            case 'technical':
                return FileText;
            default:
                return FileText;
        }
    };

    return (
        <div className="border border-translucent-emerald bg-muted-moss p-6 md:p-8 rounded-lg">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <Shield className="w-6 h-6 text-emerald-400" />
                <h3 className="font-serif text-xl md:text-2xl font-bold text-bone-white">
                    Verification Documents
                </h3>
            </div>

            <p className="text-sm text-bone-white/60 mb-6 font-mono">
                Official documentation supporting product claims and quality standards
            </p>

            {/* Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc, index) => {
                    const Icon = getIcon(doc.type);

                    return (
                        <a
                            key={index}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-4 p-4 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 hover:border-emerald-500/50 transition-all"
                        >
                            <div className="flex-shrink-0 w-12 h-12 bg-emerald-900/20 border border-emerald-500/30 rounded-lg flex items-center justify-center group-hover:bg-emerald-900/30 transition-colors">
                                <Icon className="w-6 h-6 text-emerald-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="text-bone-white font-medium text-sm md:text-base mb-1 group-hover:text-emerald-400 transition-colors">
                                    {doc.label}
                                </h4>
                                <p className="text-xs text-bone-white/50 font-mono truncate">
                                    {new URL(doc.url).hostname}
                                </p>
                            </div>

                            <ExternalLink className="w-4 h-4 text-bone-white/40 group-hover:text-emerald-400 transition-colors flex-shrink-0 mt-1" />
                        </a>
                    );
                })}
            </div>

            {/* Trust Badge */}
            <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-bone-white/50 font-mono">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>All documents are independently verified and publicly accessible</span>
                </div>
            </div>
        </div>
    );
}
