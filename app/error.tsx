'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-forest-obsidian flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-4xl font-bold text-bone-white mb-4">
          Something went wrong
        </h1>
        <p className="text-bone-white/70 font-mono mb-8">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

