import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-forest-obsidian flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-4xl font-bold text-bone-white mb-4">
          404
        </h1>
        <p className="text-bone-white/70 font-mono mb-8">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button
            variant="primary"
            className="text-lg px-8 py-4 border border-sme-gold bg-sme-gold text-forest-obsidian hover:bg-[#9A7209] hover:border-[#9A7209] font-mono uppercase tracking-wider"
          >
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

