import Link from "next/link";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function ProductNotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-deep-stone">Product Not Found</h1>
        <p className="mb-8 text-xl text-deep-stone/70">
          The product you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

