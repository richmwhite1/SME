import { FileText, Shield, ExternalLink, Lock } from "lucide-react";

interface TheVaultProps {
    urls: string[] | null;
}

export default function TheVault({ urls }: TheVaultProps) {
    if (!urls || urls.length === 0) {
        return null;
    }

    // Helper to extract filename from URL or generate a generic name
    const getDocName = (url: string, index: number) => {
        try {
            const parts = url.split('/');
            const lastPart = parts[parts.length - 1];
            // Decode URI component to handle spaces/symbols
            return decodeURIComponent(lastPart).split('?')[0]; // Remove query params
        } catch (e) {
            return `Certification Document ${index + 1}`;
        }
    };

    return (
        <div className="border border-sme-gold/30 bg-black/40 rounded-xl overflow-hidden mb-8">
            <div className="flex items-center justify-between px-6 py-4 bg-sme-gold/10 border-b border-sme-gold/20">
                <div className="flex items-center gap-3">
                    <Shield className="text-sme-gold" size={20} />
                    <h3 className="font-serif text-lg font-bold text-sme-gold tracking-wide">
                        The Vault
                    </h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-sme-gold/30 bg-black/20 text-[10px] font-mono uppercase text-sme-gold/80">
                    <Lock size={10} />
                    <span>Verified Access</span>
                </div>
            </div>

            <div className="p-2">
                {urls.map((url, index) => (
                    <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded bg-white/5 text-white/40 group-hover:text-sme-gold transition-colors">
                                <FileText size={20} />
                            </div>
                            <div>
                                <div className="font-mono text-xs text-white/50 uppercase mb-0.5">
                                    PDF Document
                                </div>
                                <div className="font-medium text-white/90 group-hover:text-white group-hover:underline underline-offset-4 decoration-sme-gold/50 transition-all">
                                    {getDocName(url, index)}
                                </div>
                            </div>
                        </div>

                        <ExternalLink className="text-white/20 group-hover:text-sme-gold transition-colors" size={16} />
                    </a>
                ))}
            </div>
        </div>
    );
}
