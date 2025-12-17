import Link from "next/link";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default function ProfileNotFound() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <h1 className="mb-4 text-4xl font-bold text-deep-stone">Profile Not Found</h1>
        <p className="mb-8 text-xl text-deep-stone/70">
          This user profile does not exist or has been removed.
        </p>
        <Link href="/">
          <Button variant="primary">Return Home</Button>
        </Link>
      </div>
    </main>
  );
}

