"use client";

import { useState } from "react";
import { seedMasterTopics } from "@/app/actions/seed-actions";
import Button from "@/components/ui/Button";
import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SeedMasterTopicsButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    summary?: { total: number; created: number; existing: number; errors: number };
    results?: Array<{ topic: string; status: string; slug?: string }>;
  } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await seedMasterTopics();
      setResult(response);
      
      // Refresh the page after a short delay to show results
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        summary: { total: 0, created: 0, existing: 0, errors: 1 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleSeed}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Seeding...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            Seed Master Topics
          </>
        )}
      </Button>

      {result && (
        <div className={`rounded-md border p-3 text-sm ${
          result.success 
            ? "border-green-200 bg-green-50 text-green-800" 
            : "border-red-200 bg-red-50 text-red-800"
        }`}>
          {result.summary && (
            <div className="space-y-1">
              <p className="font-semibold">
                {result.summary.created} created, {result.summary.existing} already existed
                {result.summary.errors > 0 && `, ${result.summary.errors} errors`}
              </p>
              {result.results && result.results.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs">View details</summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {result.results.map((r, idx) => (
                      <li key={idx}>
                        <span className="font-medium">#{r.topic}:</span> {r.status}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}





